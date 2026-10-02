export default function Section({ title, children, action }) {
  return (
    <section className="mb-4 px-3 px-lg-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mh-section-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
