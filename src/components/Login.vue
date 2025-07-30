<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { _data, server } from '../services/data-service'
import EyeOpenedImage from '../assets/eye-opened.png'
import EyeClosedImage from '../assets/eye-closed.png'
import { router } from '../router'

const firstTime = ref(false)

const email = ref('')
const password = ref('')

const ariaInvalidEmail = ref(false)
const ariaInvalidPassword = ref(false)

const serverMessage = ref('')
const noServerWarning = ref(false)
const buttonLoading = ref(false)

const passVisible = ref(false)

const emailValid = computed(() => email.value.length > 0 && email.value.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/))

const inputValidationMessage = computed(() => {
  if (password.value.length === 0) return []
  const validations: string[] = []
  validations.push(!emailValid.value ? 'Please enter a valid email' : '')
  validations.push(password.value.length < 10 ? 'Password must be at least 10 characters long' : '') // too short
  validations.push(password.value.length > 24 ? 'Password must be at most 24 characters long' : '') // too long
  validations.push(password.value.includes(' ') ? 'Password cannot contain spaces' : '') // has spaces
  validations.push(password.value.match(/\d+/g) === null ? 'Password must contain at least one number' : '') // has no numbers
  validations.push(password.value.toLowerCase() === password.value ? 'Password must contain at least one uppercase letter' : '') // all lowercase
  validations.push(password.value.toUpperCase() === password.value ? 'Password must contain at least one lowercase letter' : '') // all uppercase
  const message: string[] = []
  for (const criteria of validations) {
    if (criteria) message.push(criteria)
  }
  return firstTime.value ? message : message.filter(criteria => criteria.includes('email'))
})
const buttonActive = computed(() => {
  if (firstTime.value) return password.value.length > 0 && inputValidationMessage.value.length === 0
  return password.value.length > 0 && emailValid.value
})

async function handleSubmit(e: MouseEvent) {
  e.preventDefault()
  if (buttonLoading.value || !buttonActive.value) return
  const newUser = firstTime.value

  ariaInvalidEmail.value = false
  buttonLoading.value = true

  const reqBody: SendRequest = {
    email: email.value,
    password: password.value
  }

  const url = newUser ? server.signUp() : server.signIn()
  const response = await _data.postData(url, reqBody)
  console.log(response)
  buttonLoading.value = false

  if (!response.ok) {    
    if (!response.status || response.status === 500) {
      serverMessage.value = 'Something went wrong, please try again.'
      ariaInvalidEmail.value = true
      ariaInvalidPassword.value = true
    }
    else if (response.status === 401 || response.status === 403) serverMessage.value = 'Not authenticated to access this resource.'
    else if (response.status === 422 && response.body?.errors?.includes('wrong_credentials')) {
      serverMessage.value = 'Sorry, the entered credentials are incorrect, please try again.'
      ariaInvalidEmail.value = true
      ariaInvalidPassword.value = true
    }
    else if (response.status === 422 && response.body?.errors) {
      serverMessage.value = `Your password has the following issues: ${response.body.errors.map(e => e.replace('_', ' ')).join(', ')}`
      ariaInvalidPassword.value = true
    }
    else {
      serverMessage.value = 'Something went wrong, please try again.'
      ariaInvalidEmail.value = true
      ariaInvalidPassword.value = true
    }
  }
  else {
    const timeout = newUser ? 1000 : 10
    const msg = newUser ? 'New user successfully created.' : ''
    setTimeout(() => router.push('/main'), timeout)
    noServerWarning.value = true
    serverMessage.value = msg
  }
}

function changeMode() {
  firstTime.value = !firstTime.value
  serverMessage.value = ''
  email.value = ''
  password.value = ''
  ariaInvalidEmail.value = false
  ariaInvalidPassword.value = false
  buttonLoading.value = false
}

watch(password, () => {
  if (ariaInvalidPassword.value === true) ariaInvalidPassword.value = false
  serverMessage.value = ''
})

watch(email, () => {
  if (ariaInvalidEmail.value === true) ariaInvalidEmail.value = false
  serverMessage.value = ''
})

type SendRequest = {
  email: string
  password: string
}

</script>

<template>
  <div class="login-view">
    <div class="create-user">
      <button
          type='button'
          class="submit-button"
          @click="changeMode">
          {{firstTime ? 'LOGIN' : 'CREATE USER'}}
        </button>
    </div>
    <transition mode="out-in">
      <div class="header" v-if="serverMessage">
        <p class="server-error-message">
          <img v-if="!noServerWarning" src="https://static.vecteezy.com/system/resources/thumbnails/012/042/292/small_2x/warning-sign-icon-transparent-background-free-png.png" alt="caution" width="20px" height="20px">
          {{ serverMessage }}
        </p>
      </div>
      <div v-else class="header">
        <h1>{{firstTime ? 'SIGN UP' : 'LOGIN'}}</h1>
        <h4>Please enter your email and password</h4>
      </div>
      </transition>
    <div class="form-wrapper">
      <form id="login-form" class="form">
        <label for="email">Email</label>
        <input
          v-model="email"
          autocomplete="user"
          required
          id="email"
          type="email"
          :placeholder="'john@example.com'"
          :aria-invalid="ariaInvalidEmail"
        />
        <label for="password">Password</label>
        <div class="password-wrapper">
          <input
            v-model="password"
            :autocomplete="`${firstTime ? 'new' : 'current'}-password`"
            required
            :type="passVisible ? 'text' : 'password'"
            id="password"
            :aria-invalid="ariaInvalidPassword"
          >
          <button
            type="button" 
            class="show-password"
            :aria-label="`${passVisible ? 'hide' : 'show'}-password`"
          >
            <img
              :src="passVisible ? EyeClosedImage : EyeOpenedImage"
              :alt="`${passVisible ? 'hide' : 'show'} password`"
              width="25px"
              height="15px"
              :style="{opacity: passVisible ? '0.4' : '1'}"
              @click="passVisible = !passVisible"
            >
          </button>
        </div>
        <button
          type='submit'
          :class="['submit-button', {loading: buttonLoading, disabled: !buttonActive}]"
          :disabled="!buttonActive"
          @click="handleSubmit">
          {{firstTime ? 'Sign Up' : 'Log In'}}
        </button>
      </form>
    </div>
    <div class="validation-message-wrapper">
      <ul class="validation-messages">
          <TransitionGroup name="list">
            <li
              v-for="line, i in inputValidationMessage"
              :key="`validation-${i}`"
              class="validation-item"
            >
              {{ line }}
            </li>
        </TransitionGroup>
        </ul>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: center;
}

.create-user {
  position: absolute;
  top: 30px;
  left: 30px;
  min-width: 150px;
}
.header {
  flex: 1;
  flex-basis: 100px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

h1 {
  font-size: 60px;
  letter-spacing: 0.1ch;
}
.server-error-message {
  font-size: 24px;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
  padding: 5px 10px 5px 20px;
  border-radius: 10px;
}

.form-wrapper {
  position: relative;
  flex: 0;
  max-width: 400px;
  width: 80%;
  background-color: #60606054;
  color: white;
  padding: 24px 38px;
  /* margin: auto; */
  border-radius: 10px;
}
.form {
  display: flex;
  gap: 20px;
  flex-direction: column;
}

.validation-message-wrapper {
  flex: 1;
  flex-basis: 100px;
}
.validation-messages {
  padding-top: 2em;
}
.validation-item {
  color: rgb(255, 63, 63);
  list-style-type: '✖ ';
}
label {
  font-weight: 700;
}
input {
  padding: 8px 16px;
  height: 40px;
  font-size: 14px;
  width: 100%;
  background-color: #f8f7fab2;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
.submit-button {
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #191f66;
  color: white;
  font-size: 16px;
  font-weight: 700;
  height: 40px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  align-self: flex-end;
  cursor: pointer;
  animation: ok 0.7s infinite alternate;
}

@keyframes ok {
  from {
    box-shadow: 1px 1px 16px 3px #3e4bd09f, -1px -1px 16px 3px #3a46c49f;
  }
}

.password-wrapper {
  position: relative;
}

.show-password {
  background-color: transparent;
  border: none;
  cursor: pointer;
  position: absolute;
  right: 3%;
  top: 50%;
  transform: translateY(-50%);
}

.submit-button.loading {
  animation: none;
  cursor: wait;
  background-color: rgb(132, 131, 131);
}
.submit-button.disabled {
  animation: none;
  cursor: not-allowed;
  background-color: rgb(132, 131, 131);
}
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}
.v-enter-from,
.v-leave-to {
  opacity: 0;
}
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
}
</style>