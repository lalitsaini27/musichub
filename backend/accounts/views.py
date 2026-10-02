from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import generics, status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    UserAdminSerializer,
)
from .permissions import IsStaffOrAdminUser

User = get_user_model()


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — create an account and log the user straight in."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {'user': UserSerializer(user).data, **tokens_for_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/v1/auth/login/ — accepts username OR email in `identifier`."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']
        password = serializer.validated_data['password']

        user = User.objects.filter(username__iexact=identifier).first() \
            or User.objects.filter(email__iexact=identifier).first()

        if user is None or not user.check_password(password):
            return Response(
                {'detail': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {'detail': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response({'user': UserSerializer(user).data, **tokens_for_user(user)})


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — blacklists the given refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'refresh token is required.'}, status=400)
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response({'detail': 'Invalid or already-expired token.'}, status=400)
        return Response({'detail': 'Logged out successfully.'}, status=205)


class MeView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/v1/auth/me/ — current user's profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/ — for logged-in users on the Settings page."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Current password is incorrect.'}, status=400)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password updated successfully.'})


class ForgotPasswordView(APIView):
    """
    POST /api/v1/auth/forgot-password/
    Always returns 200 (even if the email isn't found) so the endpoint can't
    be used to enumerate registered emails.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            send_mail(
                subject='Reset your MusicHub password',
                message=(
                    f"Hi {user.username},\n\n"
                    f"Click the link below to reset your MusicHub password:\n{reset_link}\n\n"
                    "If you didn't request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )

        return Response(
            {'detail': 'If an account with that email exists, a reset link has been sent.'}
        )


class ResetPasswordView(APIView):
    """POST /api/v1/auth/reset-password/ — confirm with uid + token from the emailed link."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'detail': 'Invalid reset link.'}, status=400)

        if not default_token_generator.check_token(user, data['token']):
            return Response({'detail': 'This reset link is invalid or has expired.'}, status=400)

        user.set_password(data['new_password'])
        user.save()
        return Response({'detail': 'Password has been reset. You can now log in.'})


class UserAdminViewSet(viewsets.ModelViewSet):
    """
    /api/v1/admin/users/ — Admin Dashboard's Users tab. Staff or MusicHub
    admin-flagged users only. No create (registration is public) or PUT
    (partial updates via PATCH only — toggling is_active / is_admin_user).
    """
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserAdminSerializer
    permission_classes = [IsStaffOrAdminUser]
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def perform_update(self, serializer):
        # Never allow an admin to strip their own admin access by accident —
        # they'd lock themselves out of the dashboard with no way back in.
        if serializer.instance.id == self.request.user.id and 'is_admin_user' in serializer.validated_data:
            serializer.validated_data.pop('is_admin_user')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.id == self.request.user.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': "You can't delete your own account from here."})
        instance.delete()
