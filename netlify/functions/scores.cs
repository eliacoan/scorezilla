// Netlify C# function for highscores using LiteDB
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using LiteDB;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

public static class ScoresFunction
{
    private static string DbPath => Path.Combine(Environment.CurrentDirectory, "..", "..", "data", "scores.db");

    [FunctionName("scores")]
    public static async Task<IActionResult> Run(HttpRequest req)
    {
        using var db = new LiteDatabase(DbPath);
        var col = db.GetCollection<ScoreEntry>("scores");

        if (req.Method == "GET")
        {
            int limit = 10;
            if (req.Query.ContainsKey("limit"))
                int.TryParse(req.Query["limit"], out limit);
            var scores = col.FindAll()
                .OrderByDescending(s => s.Score)
                .ThenBy(s => s.CreatedAt)
                .Take(limit)
                .ToList();
            return new JsonResult(scores);
        }
        if (req.Method == "POST")
        {
            using var reader = new StreamReader(req.Body);
            var body = await reader.ReadToEndAsync();
            var payload = System.Text.Json.JsonSerializer.Deserialize<ScoreEntry>(body);
            if (payload == null || string.IsNullOrWhiteSpace(payload.Name) || payload.Score < 0)
                return new BadRequestObjectResult("Invalid payload");
            payload.CreatedAt = DateTime.UtcNow;
            col.Insert(payload);
            return new JsonResult(payload) { StatusCode = 201 };
        }
        return new StatusCodeResult(405);
    }

    public class ScoreEntry
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Score { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
