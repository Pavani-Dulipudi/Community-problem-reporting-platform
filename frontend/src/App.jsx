
import React, { useState, useEffect } from 'react';
import { MapPin, Upload, User, LogOut, Bell, CheckCircle, Clock, AlertCircle, Filter, Search, Trash2, Wrench, Zap, Droplet, Recycle, Wind, Lightbulb, Activity, Grid } from 'lucide-react';
import community from './assets/grievance_urban_rural (1).jpg';
const API_URL = 'http://localhost:5000/api';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [selectedService, setSelectedService] = useState(null);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  // Login/Register Form
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'user' });

  // Report Form
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    category: 'road',
    location: '',
    latitude: '',
    longitude: '',
    image: null
  });

  const services = [
    { id: 'road', name: 'Roads & Infrastructure', icon: Wrench, color: 'bg-orange-500', description: 'Potholes, Road damage, Traffic issues' },
    { id: 'electricity', name: 'Electricity', icon: Zap, color: 'bg-yellow-500', description: 'Power outages, Electrical issues' },
    { id: 'water', name: 'Water Supply', icon: Droplet, color: 'bg-blue-500', description: 'Water leaks, Supply issues' },
    { id: 'sanitation', name: 'Sanitation', icon: Recycle, color: 'bg-green-500', description: 'Waste management, Cleanliness' },
    { id: 'drainage', name: 'Drainage', icon: Wind, color: 'bg-teal-500', description: 'Blocked drains, Flooding' },
    { id: 'street_lights', name: 'Street Lights', icon: Lightbulb, color: 'bg-purple-500', description: 'Non-functional lights' },
    { id: 'public_health', name: 'Public Health', icon: Activity, color: 'bg-red-500', description: 'Health hazards, Safety' },
    { id: 'other', name: 'Other Services', icon: Grid, color: 'bg-gray-500', description: 'Miscellaneous issues' }
  ];

  const statusColors = {
  pending: 'bg-yellow-100 text-yellow-900',
  assigned: 'bg-cyan-100 text-cyan-900',
  in_progress: 'bg-purple-100 text-purple-900',
  resolved: 'bg-green-100 text-green-900',
  rejected: 'bg-red-100 text-red-900'
};


  // Initialize data after login
  useEffect(() => {
    if (currentUser) {
      fetchReports();
      fetchDepartments();
      // Set default tab based on role
      if (currentUser.role === 'admin') {
        setActiveTab('pending');
      } else {
        setActiveTab('services');
      }
    }
  }, [currentUser]);

  // Refetch reports when switching tabs
  useEffect(() => {
    if (currentUser && (activeTab === 'myReports' || activeTab === 'pending' || activeTab === 'assigned' || activeTab === 'allReports')) {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentUser.role === 'user') {
        params.append('user_id', currentUser.id);
      }
      
      const response = await fetch(`${API_URL}/reports?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched reports:', data);
        setReports(data);
        setFilteredReports(data);
      } else {
        console.error('Failed to fetch reports:', response.status);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/departments`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  // Filter reports
  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterDept !== 'all') {
      filtered = filtered.filter(r => r.department_name === filterDept);
    }

    setFilteredReports(filtered);
  }, [searchTerm, filterStatus, filterDept, reports]);
  // Admin tab-based filtering (Pending / Assigned / All)
useEffect(() => {
  if (!currentUser || currentUser.role !== 'admin') return;

  let filtered = reports;

  if (activeTab === 'pending') {
    filtered = reports.filter(r => r.status === 'pending');
  }

  if (activeTab === 'assigned') {
    filtered = reports.filter(
      r => r.status === 'assigned' || r.status === 'in_progress'
    );
  }

  if (activeTab === 'allReports') {
    filtered = reports;
  }

  setFilteredReports(filtered);
}, [activeTab, reports, currentUser]);


  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = authMode === 'login' ? '/login' : '/register';
      const body = authMode === 'login' 
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password, role: authForm.role };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentUser(data.user);
        setAuthForm({ email: '', password: '', name: '', role: 'user' });
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', reportForm.title);
      formData.append('description', reportForm.description);
      formData.append('category', reportForm.category);
      formData.append('location', reportForm.location);
      formData.append('latitude', reportForm.latitude);
      formData.append('longitude', reportForm.longitude);
      formData.append('user_id', currentUser.id);
      
      if (reportForm.image) {
        const response = await fetch(reportForm.image);
        const blob = await response.blob();
        formData.append('image', blob, 'report-image.jpg');
      }

      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Report submitted successfully:', result);
        setReportForm({
          title: '',
          description: '',
          category: 'road',
          location: '',
          latitude: '',
          longitude: '',
          image: null
        });
        setSelectedService(null);
        await fetchReports();
        setActiveTab('myReports');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportForm({ ...reportForm, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setReportForm({
          ...reportForm,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
        });
      });
    }
  };
  const deleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchReports();
      } else {
        setError('Failed to delete report');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete report');
    } finally {
      setLoading(false);
    }
  };

  const assignToDepartment = async (reportId, deptId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reports/${reportId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ department_id: deptId })
      });

      if (response.ok) {
        await fetchReports();
      }
    } catch (err) {
      console.error('Assign error:', err);
      setError('Failed to assign department');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchReports();
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (serviceId) => {
    setSelectedService(serviceId);
    setReportForm({ ...reportForm, category: serviceId });
    setActiveTab('report');
  };
  

  // Login/Register Screen

  // HOME PAGE
if (!currentUser && !showAuth) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg fixed w-full top-0 z-50 border-b border-emerald-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg shadow-md">
                <AlertCircle className="text-white" size={32} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent">
                Community Voice
              </span>
            </div>
            <div className="flex items-center space-x-4">
             <button
  onClick={() => setActiveTab('about')}
  className="text-gray-700 hover:text-indigo-600 font-medium transition"
>
  About
</button>

{activeTab === 'about' && (
  <div
  className="max-w-6xl mx-auto px-6 py-16
             h-[calc(100vh-160px)]
             overflow-y-auto
             scrollbar-thin
             scrollbar-thumb-indigo-400
             scrollbar-track-indigo-100"
>
 <button
  onClick={() => {
    setActiveTab('services'); // 👈 EXIT ABOUT PAGE
    setShowAuth(false);       // 👈 GO TO HOME
  }}
  className="flex items-center space-x-2 mb-10
             text-indigo-600 hover:text-indigo-800
             font-semibold transition"
>
  ← Back to Home
</button>

    {/* ===== TITLE ===== */}
    <div className="text-center mb-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        About Community Voice
      </h1>
      <p className="text-xl text-gray-600">
        A Digital Platform for Urban & Rural Grievance Management
      </p>
    </div>

    {/* rest of your About content remains SAME */}

    
    {/* Title */}
    <div className="text-center mb-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        About Community Voice
      </h1>
      <p className="text-xl text-gray-600">
        A Digital Platform for Urban & Rural Grievance Management
      </p>
    </div>

    {/* About Description */}
    <div className="bg-white rounded-2xl shadow-lg p-10 mb-16">
      <p className="text-gray-700 text-lg leading-relaxed mb-6">
        The <b>Community Problem Reporting Platform</b> is a citizen-centric
        web application designed to simplify the process of reporting and
        resolving public issues. It allows users to report problems related
        to roads, electricity, water supply, sanitation, public health, and
        other civic services.
      </p>

      <p className="text-gray-700 text-lg leading-relaxed">
        The platform works seamlessly for both <b>urban and rural areas</b>,
        ensuring equal access to grievance redressal services. Complaints are
        categorized department-wise and assigned to authorities for efficient
        resolution with full transparency.
      </p>
    </div>

    {/* Objectives */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {[
        { title: 'Citizen Empowerment', desc: 'Enable citizens to raise issues digitally and track progress.' },
        { title: 'Transparent Governance', desc: 'Ensure accountability through real-time complaint tracking.' },
        { title: 'Urban & Rural Coverage', desc: 'Support grievance management for both city and village areas.' }
      ].map((item, idx) => (
        <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold text-indigo-700 mb-3">
            {item.title}
          </h3>
          <p className="text-gray-700">
            {item.desc}
          </p>
        </div>
      ))}
    </div>

    {/* How It Works */}
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
        How the Platform Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { icon: '📝', title: 'Report Issue' },
          { icon: '📍', title: 'Add Location & Image' },
          { icon: '🏢', title: 'Department Assignment' },
          { icon: '✅', title: 'Issue Resolution' }
        ].map((step, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-5xl mb-4">{step.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800">
              {step.title}
            </h3>
          </div>
           
        ))}
      </div>
    </div>

    {/* Footer Note */}
    <div className="text-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-10 shadow-xl">
      <h3 className="text-2xl font-bold mb-3">
        Building Better Communities Together
      </h3>
      <p className="text-indigo-100">
        Community Voice promotes responsible governance by connecting citizens
        and authorities through a transparent digital platform.
      </p>
    </div>

  </div>
)}

              <button
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold shadow-lg"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Voice,
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Our Action</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Report civic issues in your community and track their resolution in real-time. Together, we build better neighborhoods.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-lg shadow-xl"
                >
                  Get Started
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">1000+</div>
                  <div className="text-sm text-gray-600 mt-1">Issues Resolved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600 mt-1">Active Citizens</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600">95%</div>
                  <div className="text-sm text-gray-600 mt-1">Success Rate</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-3xl transform rotate-3"></div>
              <img
                src={community}
                alt="Community"
                className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 animate-bounce">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">50+ Resolved</div>
                    <div className="text-xs text-gray-600">This Month</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Bell className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">Real-time Updates</div>
                    <div className="text-xs text-gray-600">Stay Informed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Report Any Issue</h2>
            <p className="text-xl text-gray-600">Choose from various categories to report civic problems</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map(service => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center"
                >
                  <div className={`${service.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to make a difference</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: '📷', title: 'Report', desc: 'Capture the issue with photo and location' },
              { icon: '🔍', title: 'Track', desc: 'Monitor progress in real-time' },
              { icon: '✅', title: 'Resolve', desc: 'Authorities take action' },
              { icon: '🤝', title: 'Engage', desc: 'Build better communities together' }
            ].map((step, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-all">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens working together to improve their communities
          </p>
          <button
            onClick={() => setShowAuth(true)}
            // className="bg-white text-indigo-600 px-10 py-4 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-2xl"
          >
            Start Reporting Issues
          </button>
        </div>
      </section>


      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle size={24} />
                <span className="text-xl font-bold">Community Voice</span>
              </div>
              <p className="text-gray-400">Empowering citizens to build better communities through transparent grievance management.</p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <p className="text-gray-400">Email: support@communityvoice.com</p>
              <p className="text-gray-400">Phone: +1 (555) 123-4567</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Community Voice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
  if (!currentUser) {

    
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(https://thumbs.dreamstime.com/b/aerial-view-upscale-residential-area-gated-community-street-real-estate-single-family-homes-autumn-sunny-day-260550168.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        {/* Ovedivrlay */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-cyan-900/70 to-teal-900/70"></div> */}
        {/* Logo */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-xl flex items-center space-x-2">
            {/* <AlertCircle className="text-indigo-600" size={28} /> */}
            {/* <span className="font-bold text-xl text-gray-800">Community Voice</span> */}
          </div>
        </div>

        <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertCircle className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-black-600 mt-2">Report & Track Public Issues</p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-md transition ${
                authMode === 'login' ? 'bg-white shadow' : ''
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-md transition ${
                authMode === 'register' ? 'bg-white shadow' : ''
              }`}
            >
              Register
            </button>
          </div>

          <div className="space-y-4">
            {authMode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={authForm.name}
                onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
            {authMode === 'register' && (
              <select
                value={authForm.role}
                onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="user">Citizen</option>
                <option value="admin">Admin</option>
              </select>
            )}
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold disabled:bg-gray-400 shadow-lg"
            >
              {loading ? 'Please wait...' : (authMode === 'login' ? 'Login' : 'Register')}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold text-blue-900 mb-2">Note: Backend must be running</p>
            <p className="text-blue-800">Start Flask: python app.py</p>
          </div>
        </div>
      </div>
    );
  }
// ===== Dashboard Statistics (Dynamic) =====
const totalIssues = reports.length;

const resolvedIssues = reports.filter(
  r => r.status === 'resolved'
).length;

const activeCitizens = new Set(
  reports.map(r => r.user_id)
).size;

const resolutionRate =
  totalIssues > 0
    ? Math.round((resolvedIssues / totalIssues) * 100)
    : 0;

  return (
   <div className="min-h-screen bg-gradient-to-br from-sky-100 via-teal-50 to-slate-100">
      {/* Header with Logo */}
      <header className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg relative">
        {/* Logo */}
        <div className="absolute top-4 right-4">
          {/* <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center space-x-2"> */}
            {/* <AlertCircle className="text-white" size={24} /> */}
            {/* <span className="font-bold text-sm"></span> */}
          {/* </div> */}
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <AlertCircle size={32} />
              <div>
                <h1 className="text-2xl font-bold">Community Voice</h1>
                <p className="text-sm text-indigo-200">{currentUser.role === 'admin' ? 'Admin Dashboard' : 'Citizen Portal'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-xs text-indigo-200">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setActiveTab('services');
                  setSelectedService(null);
                }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition backdrop-blur-sm"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {currentUser.role === 'user' && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('services');
                    setSelectedService(null);
                  }}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'services'
                      ? 'border-b-4 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setActiveTab('myReports')}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'myReports'
                      ? 'border-b-4 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  My Reports
                </button>
              </>
            )}
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'pending'
                      ? 'border-b-4 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Pending Reports
                </button>
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'assigned'
                      ? 'border-b-4 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  Assigned
                </button>
                <button
                  onClick={() => setActiveTab('allReports')}
                  className={`px-6 py-4 font-medium transition ${
                    activeTab === 'allReports'
                      ? 'border-b-4 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  All Reports
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* ================= CITIZEN DASHBOARD ================= */}
{currentUser.role === 'user' && activeTab === 'services' && (
  <>
    {/* STATS CARDS
    <div className="mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-3xl font-bold">{totalIssues}</h2>
          <p className="mt-2 text-sm">Issues Reported</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-3xl font-bold">{resolvedIssues}</h2>
          <p className="mt-2 text-sm">Issues Resolved</p>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-3xl font-bold">{activeCitizens}</h2>
          <p className="mt-2 text-sm">Active Citizens</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl shadow-lg p-6 text-center">
          <h2 className="text-3xl font-bold">{resolutionRate}%</h2>
          <p className="mt-2 text-sm">Resolution Rate</p>
        </div>
      </div>
    </div> */}

    {/* HOW IT WORKS */}
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
        How It Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-3">📷</div>
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">Report</h3>
          <p className="text-gray-600 text-sm">
            Spot a problem? Take a photo and submit a report with location details.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">Track</h3>
          <p className="text-gray-600 text-sm">
            Follow your report’s progress and get real-time updates.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-3">✅</div>
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">Resolve</h3>
          <p className="text-gray-600 text-sm">
            Authorities review and resolve issues in your community.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="text-lg font-semibold text-indigo-600 mb-2">Engage</h3>
          <p className="text-gray-600 text-sm">
            Support other reports and collaborate to improve your neighborhood.
          </p>
        </div>
      </div>
    </div>
  </>
)}

      {/* Dashboard Overview */}
<div className="mb-12">
  Stats Cards
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
    {[
      { value: totalIssues, label: 'Issues Reported' },
      { value: resolvedIssues, label: 'Issues Resolved' },
      { value: activeCitizens, label: 'Active Citizens' },
      { value: `${resolutionRate}%`, label: 'Resolution Rate' },
    ].map((item, index) => (
      <div
        key={index}
        className="bg-gradient-to-r from-cyan-500 to-teal-500 
        text-white rounded-xl shadow-lg p-6 text-center"
      >
        <h2 className="text-3xl font-bold">{item.value}</h2>
        <p className="mt-2 text-sm tracking-wide">{item.label}</p>
      </div>
    ))}
  </div>
  </div>

        {/* Services Grid (User only) */}
        {activeTab === 'services' && currentUser.role === 'user' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Select a Service</h2>
            <p className="text-gray-600 mb-8">Choose the type of issue you want to report</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map(service => {
                const Icon = service.icon;
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg p-6 
hover:shadow-2xl transition-all duration-300 
transform hover:-translate-y-2 hover:scale-[1.02] 
animate-fade-in text-left"

                  >
                    <div className={`${service.color} w-16 h-16 rounded-full 
flex items-center justify-center mb-4 
shadow-lg ring-4 ring-white/60`}>

                      <Icon className="text-white" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm">{service.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* New Report Form */}
        {activeTab === 'report' && currentUser.role === 'user' && selectedService && (
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => {
                setActiveTab('services');
                setSelectedService(null);
              }}
              className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center space-x-2"
            >
              <span>← Back to Services</span>
            </button>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit a New Report</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled
                  >
                    {services.map(service => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={reportForm.location}
                      onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                      placeholder="Enter location or use GPS"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                    >
                      <MapPin size={20} />
                      <span>GPS</span>
                    </button>
                  </div>
                  {reportForm.latitude && (
                    <p className="text-sm text-gray-600 mt-2">
                      Coordinates: {reportForm.latitude}, {reportForm.longitude}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {reportForm.image ? (
                        <img src={reportForm.image} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload size={48} className="text-gray-400 mb-2" />
                          <p className="text-gray-600">Click to upload image</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleReportSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition font-semibold text-lg disabled:bg-gray-400"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>

                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        {(activeTab === 'myReports' || activeTab === 'pending' || activeTab === 'assigned' || activeTab === 'allReports') && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
                {currentUser.role === 'admin' && (
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Reports Grid */}
            <div className="grid gap-6">
                           {loading ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-xl text-gray-600">Loading reports...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <AlertCircle size={64} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-xl text-gray-600">No reports found</p>
                </div>
              ) : (
                filteredReports.map(report => (
                  <div key={report.id} className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden animate-fade-in">

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-800">{report.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[report.status]}`}>
                              {report.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3">{report.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <User size={16} />
                              <span>{report.user_name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin size={16} />
                              <span>{report.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock size={16} />
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {report.department_name && (
                            <p className="mt-2 text-sm text-indigo-600 font-semibold">
                              Assigned to: {report.department_name}
                            </p>
                          )}
                        </div>
                        {report.image_path && (
                          <img src={`http://localhost:5000/${report.image_path}`} alt="Report" className="w-32 h-32 object-cover rounded-lg ml-4" />
                        )}
                      </div>{/* User Actions */}
                  {currentUser.role === 'user' && (
                    <div className="border-t pt-4 mt-4">
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center space-x-2"
                      >
                        <Trash2 size={16} />
                        <span>Delete Report</span>
                      </button>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {currentUser.role === 'admin' && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex flex-wrap gap-3">
                        {report.status === 'pending' && (
                          <select
                            onChange={(e) => assignToDepartment(report.id, parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Assign to Department</option>
                            {departments
                              .filter(d => d.category === report.category)
                              .map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                              ))}
                          </select>
                        )}
                        {report.status === 'assigned' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'in_progress')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {report.status === 'in_progress' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center space-x-1"
                          >
                            <CheckCircle size={16} />
                            <span>Mark Resolved</span>
                          </button>
                        )}
                        {report.status === 'pending' && (
                          <button
                            onClick={() => updateReportStatus(report.id, 'rejected')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </main>
</div>);
};
export default App;