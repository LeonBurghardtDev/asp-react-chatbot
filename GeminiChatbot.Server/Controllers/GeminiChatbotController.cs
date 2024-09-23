using Microsoft.AspNetCore.Mvc;
using Mscc.GenerativeAI;
using GeminiChatbot.Server.Constants;

namespace GeminiChatbot.Server.Controllers
{
    [ApiController]
    [Route("api/ai")]
    public class GeminiChatbotController : ControllerBase
    {

        private readonly GenerativeModel _geminiModel;

        public GeminiChatbotController()
        {
            _geminiModel = InitializeGeminiModel();
        }

        /// <summary>
        /// Processes a text query and returns the AI-generated response.
        /// </summary>
        /// <param name="query">The query parameter from the request.</param>
        /// <returns>AI-generated content or error details.</returns>
        [HttpGet("ask")]
        public async Task<IActionResult> GenerateResponseAsync([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { error = ErrorStrings.MissingQueryError });
            }

            return await ProcessQueryAsync(query);
        }

        /// <summary>
        /// Initializes the Gemini AI model using the API key from environment variables.
        /// </summary>
        /// <returns>The configured Gemini model.</returns>
        /// <exception cref="InvalidOperationException">Thrown if the API key is missing.</exception>
        private GenerativeModel InitializeGeminiModel()
        {
            string apiKey = GetApiKey();
            GoogleAI googleAI = new GoogleAI(apiKey);
            return googleAI.GenerativeModel(Model.Gemini15Pro);
        }

        /// <summary>
        /// Retrieves the API key from the environment variables.
        /// </summary>
        /// <returns>The API key.</returns>
        /// <exception cref="InvalidOperationException">Thrown if the API key is not found.</exception>
        private string GetApiKey()
        {
            string? apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException(ErrorStrings.MissingApiKeyError);
            }
            return apiKey;
        }

        /// <summary>
        /// Processes the query by sending it to the Gemini AI model and returns the result.
        /// </summary>
        /// <param name="query">The text query to process.</param>
        /// <returns>AI-generated content or error details in an IActionResult.</returns>
        private async Task<IActionResult> ProcessQueryAsync(string query)
        {
            try
            {
                GenerateContentResponse response = await _geminiModel.GenerateContent(query);
                return Ok(new { response = response.Text });
            }
            catch (HttpRequestException httpEx)
            {
                return StatusCode(501, new { error = ErrorStrings.HttpRequestError, details = httpEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ErrorStrings.GenericError, details = ex.Message });
            }
        }
    }
}
