export function FeaturePills({ capabilities }) {
  const pills = [];

  if (capabilities?.supportsDineIn) {
    pills.push({ label: 'Dine-in' });
  }
  if (capabilities?.supportsDeliveryDispatch) {
    pills.push({ label: 'Delivery' });
  }
  pills.push({ label: 'Pickup' });
  if (capabilities?.supportsScheduling) {
    pills.push({ label: 'Book ahead' });
  }
  pills.push({ label: 'Mobile Money' });

  if (pills.length === 0) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {pills.map((f) => (
          <div
            key={f.label}
            className="flex items-center justify-center gap-2.5 rounded-full bg-sage px-6 py-3.5 text-sm font-medium text-forest"
          >
            {f.label}
          </div>
        ))}
      </div>
    </section>
  );
}
