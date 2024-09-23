namespace GeminiChatbot.Server.Constants
{
    internal static class ErrorStrings
    {
        internal const string MissingApiKeyError = "GEMINI_API_KEY is not set in the environment variables.";
        internal const string MissingQueryError = "Query parameter is required.";
        internal const string HttpRequestError = "An error occurred while processing the request.";
        internal const string GenericError = "An internal error occurred.";
    }
}
