import tap from "../../assets/ui/tap.png";

     const Opening = ({ onStart }) => {
       return (
         <div className="relative w-full h-full">
           <img src={tap} alt="image/png" className="w-full h-full object-cover" />
           <button
             onClick={onStart}
             className="absolute bottom-0 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white
      hover:bg-blue-600 transition-colors z-10"
          >
            Start
          </button>
        </div>
      );
    };

export default Opening;
