import axios, { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';
import { appStorage } from './storage.service';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'budget_auth_token';

export type ResponseFormat = 'json' | 'text' | 'blob';

export interface FetchApiOptions extends Omit<AxiosRequestConfig, 'data' | 'responseType'> {
  body?: unknown;
  responseType?: ResponseFormat;
}

interface BaseResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  raw: AxiosResponse;
}

export interface JsonResponse<T> extends BaseResponse {
  data: T;
  text?: never;
  blob?: never;
}

export interface TextResponse extends BaseResponse {
  data?: never;
  text: string;
  blob?: never;
}

export interface BlobResponse extends BaseResponse {
  data?: never;
  text?: never;
  blob: Blob;
}

export async function fetchAPI(
  endpoint: string,
  options: FetchApiOptions & { responseType: 'blob' }
): Promise<BlobResponse>;

export async function fetchAPI(
  endpoint: string,
  options: FetchApiOptions & { responseType: 'text' }
): Promise<TextResponse>;

export async function fetchAPI<T = unknown>(
  endpoint: string,
  options?: FetchApiOptions & { responseType?: 'json' }
): Promise<JsonResponse<T>>;

export async function fetchAPI<T = unknown>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<JsonResponse<T> | TextResponse | BlobResponse> {
  const { body, responseType = 'json', headers: customHeaders, method = 'GET', ...restOptions } = options;

  const url =
    endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const axiosHeaders = new AxiosHeaders(customHeaders as Record<string, string>);

  const token = appStorage.get(TOKEN_KEY) as string | null;
  if (token && !axiosHeaders.has('Authorization')) {
    axiosHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    typeof body !== 'string'
  ) {
    if (!axiosHeaders.has('Content-Type')) {
      axiosHeaders.set('Content-Type', 'application/json');
    }
  }

  const axiosConfig: AxiosRequestConfig = {
    url,
    method,
    headers: axiosHeaders,
    data: body,
    responseType: responseType === 'json' ? 'json' : responseType,
    validateStatus: () => true,
    ...restOptions,
  };

  const response = await axios.request(axiosConfig);

  const nativeHeaders = new Headers();
  Object.entries(response.headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      nativeHeaders.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => nativeHeaders.append(key, v));
    }
  });

  const baseResult: BaseResponse = {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    headers: nativeHeaders,
    raw: response,
  };

  if (responseType === 'blob') {
    return { ...baseResult, blob: response.data as Blob };
  }

  if (responseType === 'text') {
    return { ...baseResult, text: String(response.data) };
  }

  if (response.status === 204) {
    return { ...baseResult, data: null as T };
  }

  return { ...baseResult, data: response.data as T };
}
