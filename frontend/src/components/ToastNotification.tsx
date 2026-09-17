export default function ToastNotification({ title, msg, type }: { title: string; msg: string; type: string }) {
  const colors = type === 'error'
    ? 'bg-red-950 border-red-600 text-red-400'
    : 'bg-green-950 border-green-600 text-green-400';

  return (
    <div className={`border border-l-4 rounded-xl p-3 min-w-[250px] shadow-2xl animate-slide-in ${colors}`}>
      <p className="font-bold text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{msg}</p>
    </div>
  );
}
