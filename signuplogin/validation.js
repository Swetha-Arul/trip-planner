const form = document.getElementById('form');
const fname_input = document.getElementById('fname-input');
const username_input = document.getElementById('username-input');
const email_input = document.getElementById('email-input');
const password_input = document.getElementById('password-input');
const repeat_password_input = document.getElementById('repeat-password-input');
const error_message = document.getElementById('error-message');

form.addEventListener('submit', (e) => {
  let errors = [];

  if (fname_input) {
    // Signup form validation
    errors = getSignupFormErrors(fname_input.value, username_input.value, email_input.value, password_input.value, repeat_password_input.value);
  } else {
    // Login form validation
    errors = getLoginFormErrors(email_input.value, password_input.value);
  }

  if (errors.length > 0) {
    e.preventDefault();
    error_message.innerText = errors.join('. ');
  }
});

function getSignupFormErrors(fname, username, email, password, repeatPassword) {
  let errors = [];
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!fname.trim()) {
    errors.push('First name is required');
    fname_input.parentElement.classList.add('incorrect');
  }
  if (!username.trim()) {
    errors.push('Username is required');
    username_input.parentElement.classList.add('incorrect');
  }
  if (!email.trim()) {
    errors.push('Email is required');
    email_input.parentElement.classList.add('incorrect');
  }
  if (!password.trim()) {
    errors.push('Password is required');
    password_input.parentElement.classList.add('incorrect');
  } else if (!passwordRegex.test(password)) {
    errors.push('Password must be at least 8 characters, include 1 lowercase letter, 1 uppercase letter, and 1 number');
    password_input.parentElement.classList.add('incorrect');
  }
  if (password !== repeatPassword) {
    errors.push('Passwords do not match');
    password_input.parentElement.classList.add('incorrect');
    repeat_password_input.parentElement.classList.add('incorrect');
  }
  return errors;
}


function getLoginFormErrors(email, password){
  let errors = []

  if(email === '' || email == null){
    errors.push('Email is required')
    email_input.parentElement.classList.add('incorrect')
  }
  if(password === '' || password == null){
    errors.push('Password is required')
    password_input.parentElement.classList.add('incorrect')
  }

  return errors;
}
// Remove error styling on input change
const allInputs = [fname_input, username_input, email_input, password_input, repeat_password_input].filter(input => input != null);

allInputs.forEach(input => {
  input.addEventListener('input', () => {
    if (input.parentElement.classList.contains('incorrect')) {
      input.parentElement.classList.remove('incorrect');
      error_message.innerText = '';
    }
  });
});

form.addEventListener('submit', (e) => {
  let errors = [];

  if (fname_input) {
    // Signup form validation
    errors = getSignupFormErrors(fname_input.value, username_input.value, email_input.value, password_input.value, repeat_password_input.value);
  } else {
    // Login form validation
    errors = getLoginFormErrors(email_input.value, password_input.value);
  }

  if (errors.length > 0) {
    e.preventDefault();
    error_message.innerText = errors.join('. ');
  } else {
    // Redirect to the map page if no errors
    window.location.href = '../map/map.html';
  }
});