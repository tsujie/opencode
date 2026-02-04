import type { LanguageModelV2 } from "@ai-sdk/provider"
import type { FetchFunction } from "@ai-sdk/provider-utils"
import { KiroLanguageModel } from "./kiro-language-model"
import { getKiroToken } from "../../../../plugin/kiro"

export interface KiroProviderSettings {
  apiKey?: string
  baseURL?: string
  region?: string
  headers?: Record<string, string>
  fetch?: FetchFunction
}

export interface KiroProvider {
  (modelId: string): LanguageModelV2
  languageModel(modelId: string): LanguageModelV2
}

export function createKiro(options: KiroProviderSettings = {}): KiroProvider {
  const region = options.region ?? "us-east-1"
  const baseURL = options.baseURL ?? `https://codewhisperer.${region}.amazonaws.com`
  
  let cachedToken: string | undefined
  
  // Initialize token
  getKiroToken().then(token => {
    cachedToken = token?.access_token ?? options.apiKey
  })
  
  const createLanguageModel = (modelId: string): LanguageModelV2 => {
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const token = await getKiroToken()
      cachedToken = token?.access_token ?? options.apiKey
      const fetchFn = options.fetch ?? fetch
      return fetchFn(input, { ...init })
    }
    
    return new KiroLanguageModel(modelId, {
      provider: "kiro",
      apiKey: cachedToken,
      baseURL,
      headers: options.headers,
      fetch: customFetch as FetchFunction,
    })
  }
  
  const provider = (modelId: string): LanguageModelV2 => createLanguageModel(modelId)
  provider.languageModel = createLanguageModel

  return provider as KiroProvider
}
