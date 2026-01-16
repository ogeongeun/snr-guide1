export default function PageShell({ title, right, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-[22px] lg:text-[28px] font-black text-slate-900">
              {title}
            </h1>
            <div className="mt-1 h-1 w-16 rounded-full bg-slate-200" />
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>

        {/* 모바일 */}
        <div className="lg:hidden mx-auto w-full max-w-[430px]">{children}</div>

        {/* PC */}
        <div className="hidden lg:block">{children}</div>
      </div>
    </div>
  );
}
