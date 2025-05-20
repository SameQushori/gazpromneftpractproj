import Header from "./components/Header/Header";
import HeroSection from "./components/HeroSection/HeroSection";
import VideoBackground from "./components/VideoBackground/VideoBackground";
import Footer from "./components/Footer/Footer";
import "./styles/common.css";

function App() {
  return (
    <div className="app">
      <VideoBackground />
      <Header />
      <main className="main-content">
      <HeroSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
