const TOKEN = 'some_token'
const BASE_URL = 'https://api.some-domain.com'
const authHeader = (): { Authorization: string } => {
  return {
    Authorization: 'Bearer ' + TOKEN
  }
}
async function makeRequest<T>(method: 'GET', url: string, data: null): Promise<Res<T>>
async function makeRequest<T>(method: SendMethod, url: string, data?: object): Promise<Res<T>>
async function makeRequest<T>(method: 'GET' | SendMethod, url: string, data?: object | null): Promise<Res<T>>{
  const authHead = authHeader()
  const req = new Request(url, {
    method,
    headers: {
      ...authHead,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : null
  })
  console.log(req)
  let res: Response | null
  try {
      // res = await fetch(req)
      const success = Math.round(Math.random() * 4)
      const status = success < 4 ? 200 : 500
      const blob = new Blob();
      const mockResp = new Response(blob, { status })
      mockResp.json = () => Promise.resolve({success: success < 4})
      res = await Promise.resolve(mockResp)
  } catch (e) {
    console.error(`${method} data error:`, e)
    res = null
  }
  if (!res) {
    return { ok: false }
  }
  const body: T & E = await res.json().catch((e) => {
    console.error('couldn\'t parse to json', res, e)
  })
  return { ok: res.ok, body, headers: res.headers, status: res.status }
}

export const _data = {
  getData: <T>(url: string) => makeRequest<T>('GET', url, null),
  postData: <T>(url: string, data: object) => makeRequest<T>('POST', url, data)
}

export const server = {
  signUp: () => `${BASE_URL}/sign-up`,
  signIn: () => `${BASE_URL}/sign-in`
}

type E = {
  errors?: ErrorString[]
}

type ErrorString = 'invalid_request'  | 'too_short' | 'too_long' |  'no_whitespace' |  'missing_digits' |  'missing_uppercase' |  'missing_lowercase' | 'wrong_credentials'


type SendMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type Res<T> = {
  ok: true
  body: T
  headers: Headers
  status?: number
} | {
  ok: false
  body?: E
  headers?: Headers
  status?: number
}