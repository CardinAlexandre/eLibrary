using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecommenderService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreatePostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookSimilarities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: false),
                    SimilarBookId = table.Column<Guid>(type: "uuid", nullable: false),
                    SimilarityScore = table.Column<double>(type: "double precision", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SimilarityReason = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookSimilarities", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserInteractions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookId = table.Column<Guid>(type: "uuid", nullable: false),
                    InteractionType = table.Column<string>(type: "text", nullable: false),
                    InteractionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: true),
                    Tags = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "text", nullable: true),
                    Language = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInteractions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookSimilarities_BookId_SimilarBookId",
                table: "BookSimilarities",
                columns: new[] { "BookId", "SimilarBookId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookSimilarities_SimilarityScore",
                table: "BookSimilarities",
                column: "SimilarityScore");

            migrationBuilder.CreateIndex(
                name: "IX_UserInteractions_BookId",
                table: "UserInteractions",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_UserInteractions_InteractionDate",
                table: "UserInteractions",
                column: "InteractionDate");

            migrationBuilder.CreateIndex(
                name: "IX_UserInteractions_UserId",
                table: "UserInteractions",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookSimilarities");

            migrationBuilder.DropTable(
                name: "UserInteractions");
        }
    }
}
