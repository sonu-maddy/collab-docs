import { http } from './http';

export const documentsApi = {
  list: () => http('/documents').then((d) => d.documents),
  get: (id) => http(`/documents/${id}`).then((d) => d.document),
  create: (payload = {}) => http('/documents', { method: 'POST', body: payload }).then((d) => d.document),
  update: (id, patch) => http(`/documents/${id}`, { method: 'PATCH', body: patch }).then((d) => d.document),
  remove: (id) => http(`/documents/${id}`, { method: 'DELETE' }),
  share: (id, { email, role }) => http(`/documents/${id}/share`, { method: 'POST', body: { email, role } }).then((d) => d.document),
  unshare: (id, userId) => http(`/documents/${id}/share/${userId}`, { method: 'DELETE' }).then((d) => d.document),
  importFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return http('/documents/import', { method: 'POST', formData }).then((d) => d.document);
  },
};

export const SUPPORTED_UPLOADS = ['.txt', '.md', '.docx'];
