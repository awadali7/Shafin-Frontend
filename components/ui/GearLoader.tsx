export default function GearLoader() {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center relative selection:bg-red-500 selection:text-white bg-white overflow-hidden">
            <style>{`
                @keyframes gear-loader-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes gear-loader-pulse-text {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
                @keyframes gear-loader-pulse-glow {
                    0%, 100% {
                        box-shadow: 0 0 15px rgba(229, 57, 53, 0.1), 0 0 30px rgba(229, 57, 53, 0.1);
                    }
                    50% {
                        box-shadow: 0 0 25px rgba(229, 57, 53, 0.3), 0 0 50px rgba(229, 57, 53, 0.2);
                    }
                }
                .gear-loader-spin { animation: gear-loader-spin 2.5s linear infinite; }
                .gear-loader-pulse-text { animation: gear-loader-pulse-text 1.5s ease-in-out infinite; }
                .gear-loader-glow-ring { animation: gear-loader-pulse-glow 2s ease-in-out infinite; border-radius: 50%; }
                .gear-loader-metallic {
                    background: linear-gradient(to bottom, #333333, #999999);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>

            <div
                className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at center, #f1f1f1 0%, #ffffff 70%)",
                }}
            />

            <div className="z-10 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center w-24 h-24 mb-8 gear-loader-glow-ring">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#e53935"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-16 h-16 gear-loader-spin drop-shadow-lg"
                    >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3 h-3 bg-white border border-[#e53935] rounded-full"></div>
                    </div>
                </div>

                <h2 className="text-sm md:text-base font-semibold tracking-[0.3em] uppercase gear-loader-metallic gear-loader-pulse-text">
                    Revving up...
                </h2>

                <div className="w-32 h-[2px] bg-gray-800 mt-6 rounded-full overflow-hidden">
                    <div
                        className="w-1/2 h-full bg-[#e53935] rounded-full opacity-80"
                        style={{
                            animation: "gear-loader-pulse-glow 1.5s ease-in-out infinite alternate",
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
