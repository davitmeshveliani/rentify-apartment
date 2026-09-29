import { api } from './api'; // შენი axios ინსტანსი

export const userService = {
  // რეგისტრაცია
  async register(data: { email: string; password: string; [key: string]: any }) {
    const response = await api.post('/api/users/register/', data); // <--- აქ უნდა იყოს /api/users/register/
    return response.data;
  },

  // ლოგინი
  async login(data: { email: string; password: string }) {
    const response = await api.post('/api/users/login/', data); // <--- /api/users/login/
    return response.data;
  },

  // პროფილი
  async getProfile() {
    const response = await api.get('/api/users/profile/'); // <--- /api/users/profile/
    return response.data;
  },

  // ჰოსტად გახდომა
 async becomeHost() {
  const response = await api.post('/api/users/become-host/', {
    role: 'HOST',
  });
  return response.data;
},

  // გასვლა (Logout)
  async logout() {
    const response = await api.post('/api/users/logout/'); // <--- /api/users/logout/
    return response.data;
  },
};