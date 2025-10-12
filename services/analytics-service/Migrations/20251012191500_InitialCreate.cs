using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AnalyticsService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookStatistics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Genre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ViewCount = table.Column<int>(type: "int", nullable: false),
                    LoanCount = table.Column<int>(type: "int", nullable: false),
                    ReviewCount = table.Column<int>(type: "int", nullable: false),
                    AverageRating = table.Column<double>(type: "float", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GenreStatistics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Genre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BookCount = table.Column<int>(type: "int", nullable: false),
                    TotalLoans = table.Column<int>(type: "int", nullable: false),
                    ActiveLoans = table.Column<int>(type: "int", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenreStatistics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LoanEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EventDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReturnDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoanEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookStatistics_BookId",
                table: "BookStatistics",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_BookStatistics_Genre",
                table: "BookStatistics",
                column: "Genre");

            migrationBuilder.CreateIndex(
                name: "IX_GenreStatistics_Genre",
                table: "GenreStatistics",
                column: "Genre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LoanEvents_BookId",
                table: "LoanEvents",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_LoanEvents_EventDate",
                table: "LoanEvents",
                column: "EventDate");

            migrationBuilder.CreateIndex(
                name: "IX_LoanEvents_UserId",
                table: "LoanEvents",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookStatistics");

            migrationBuilder.DropTable(
                name: "GenreStatistics");

            migrationBuilder.DropTable(
                name: "LoanEvents");
        }
    }
}

