import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { Login } from './pages/Login';
import { Archives } from './pages/Archives';
import { Categories } from './pages/Categories';
import { Tags } from './pages/Tags';
import { About } from './pages/About';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminPosts } from './pages/AdminPosts';
import { AdminPostEdit } from './pages/AdminPostEdit';
import { AdminCategories } from './pages/AdminCategories';
import { AdminSettings } from './pages/AdminSettings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/archives" element={<Archives />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/about" element={<About />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/posts" element={<AdminPosts />} />
        <Route path="/admin/posts/new" element={<AdminPostEdit />} />
        <Route path="/admin/posts/edit/:id" element={<AdminPostEdit />} />
        <Route path="/admin/categories" element={<AdminCategories activeTab="categories" />} />
        <Route path="/admin/tags" element={<AdminCategories activeTab="tags" />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
