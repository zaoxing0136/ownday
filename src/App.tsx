import { BrowserRouter, Route, Routes } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Today from "@/pages/Today";
import WeeklyFocus from "@/pages/WeeklyFocus";
import MonthlyFocus from "@/pages/MonthlyFocus";
import Roles from "@/pages/Roles";
import Review from "@/pages/Review";
import NotFound from "@/pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Today />} />
      <Route path="/week" element={<WeeklyFocus />} />
      <Route path="/month" element={<MonthlyFocus />} />
      <Route path="/roles" element={<Roles />} />
      <Route path="/review" element={<Review />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <BottomNav />
  </BrowserRouter>
);

export default App;
