import { Route, Routes, useLocation } from 'react-router-dom';
import { Footer } from './pages/Footer';
import { Navbar } from './pages/Navbar';
import { Gallery } from './pages/gallery/Gallery';
import { Home } from './pages/home/Home';
import { JoinUs } from './pages/join-us/JoinUs';
import { Lab } from './pages/lab/Lab';
import { News } from './pages/news/News';
import { People } from './pages/people/People';
import { Publications } from './pages/publications/Publications';
import { Research } from './pages/research/Research';

export default function App() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <div className="page-transition" key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/research" element={<Research />} />
            <Route path="/people" element={<People />} />
            <Route path="/lab" element={<Lab />} />
            <Route path="/publications" element={<Publications />} />
            <Route path="/news" element={<News />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/join-us" element={<JoinUs />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}

