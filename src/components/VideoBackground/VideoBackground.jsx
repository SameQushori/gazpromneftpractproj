import "./styles.css";

const VideoBackground = () => {
  return (
    <div className="video-background">
      <video autoPlay muted loop className="video">
        <source src="src\assets\videos\appbackground.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>
    </div>
  );
};

export default VideoBackground;
