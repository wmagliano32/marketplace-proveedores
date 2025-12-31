import AdSlot from "@/components/AdSlot";

export default function SideSkins() {
  return (
    <>
      {/* Solo pantallas muy anchas: centrado vertical entre header y footer (aprox) */}
      <div
        className="hidden 2xl:block fixed left-4 z-30 w-[180px]"
        style={{ top: "calc(50% + 40px)", transform: "translateY(-50%)" }}
      >
        <AdSlot placement="LEFT_RAIL" variant="skyscraper" hideIfEmpty />
      </div>

      <div
        className="hidden 2xl:block fixed right-4 z-30 w-[180px]"
        style={{ top: "calc(50% + 40px)", transform: "translateY(-50%)" }}
      >
        <AdSlot placement="RIGHT_RAIL" variant="skyscraper" hideIfEmpty />
      </div>
    </>
  );
}
