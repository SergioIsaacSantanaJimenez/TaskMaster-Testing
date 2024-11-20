async function loadModal(modalId, modalPath) {
    try {
      const response = await fetch(modalPath);
      const content = await response.text();
      const modalElement = document.querySelector(modalId + ' .modal-content');
      if (modalElement) {
        modalElement.innerHTML = content;
      }
    } catch (error) {
      console.error('Error loading modal:', error);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    // Index page modals
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.addEventListener('show.bs.modal', () => {
        loadModal('#loginModal', '../views/modals/login.html');
      });
    }
  
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
      registerModal.addEventListener('show.bs.modal', () => {
        loadModal('#registerModal', '../views/modals/register.html');
      });
    }
  
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
      paymentModal.addEventListener('show.bs.modal', () => {
        loadModal('#paymentModal', '../views/modals/payment.html');
      });
    }
  
    // Dashboard page modals
    /**const editTaskModal = document.getElementById('editTaskModal');
    if (editTaskModal) {
      editTaskModal.addEventListener('show.bs.modal', () => {
        loadModal('#editTaskModal', '../views/modals/task-edit.html');
      });
    }
    */
  
    const createTaskModal = document.getElementById('createTaskModal');
    if (createTaskModal) {
      createTaskModal.addEventListener('show.bs.modal', () => {
        loadModal('#createTaskModal', '../views/modals/task-create.html');
      });
    }
  });