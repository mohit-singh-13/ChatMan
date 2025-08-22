import type { TVideoBase64 } from "@/pages/Home";
import Container from "./Container";
import { X } from "lucide-react";

const Preview = ({
  videos,
  onClose,
}: {
  videos: TVideoBase64[];
  onClose: () => void;
}) => {
  return (
    <div className="absolute inset-0 flex justify-center items-center">
      <div className="absolute inset-0 z-[10] bg-black opacity-50"></div>

      <Container className="flex justify-center items-center">
        <div className="h-[80%] w-full max-w-4xl rounded-xl bg-white relative z-[11] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Video Preview
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Video Grid */}
          <div className="p-6 md:px-20 overflow-y-auto max-h-full pb-20">
            <div className="grid grid-cols-1 gap-6">
              {videos.map((video, index) => (
                <div
                  key={video.fileId + Date.now() + index}
                  className="bg-gray-50 rounded-lg p-4 shadow-sm"
                >
                  <video
                    controls
                    className="w-full rounded-lg shadow-md"
                    preload="metadata"
                  >
                    <source src={video.videoUrl} type="video/mp4" />
                    <source src={video.videoUrl} type="video/webm" />
                    <source src={video.videoUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>

                  {/* Optional: Video info */}
                  <div className="mt-3 text-sm text-gray-600">
                    Video {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Preview;
