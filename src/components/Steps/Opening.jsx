import tap from "../../assets/ui/tap.png";

const Opening = ({ onStart }) => {
  return (
    <div className="relative w-full h-full">
      <img
        src={tap}
        alt="image/png"
        className="w-full h-full object-cover object-top"
      />
      <p className="bg-white">Tap to start</p>
      <button
        onClick={onStart}
        className="absolute bottom-[-35%] left-1/2 transform -translate-x-1/2 px-8 py-4 bg-[#BF9A30] px-16 rounded-full uppercase font-bold text-5xl text-white hover:bg-blue-600 transition-colors z-10"
      >
        NEXT →
      </button>
    </div>
  );
};

export default Opening;