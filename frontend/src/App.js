import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CraftSelection from "./pages/CraftSelection";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CraftSelection />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
