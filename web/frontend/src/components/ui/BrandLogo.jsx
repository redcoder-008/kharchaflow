import kharchaflowLogo from "../../assets/kharchaflow-bg.jpeg";

export default function BrandLogo({ className = "w-10 h-10" }) {
  return (
    <div className={`${className} overflow-hidden rounded-lg shrink-0`}>
      <img
        src={kharchaflowLogo}
        alt="KharchaFlow"
        className="w-full h-full object-contain rounded-lg"
      />
    </div>
  );
}
