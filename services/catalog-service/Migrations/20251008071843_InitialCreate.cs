using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CatalogService.Migrations;

/// <inheritdoc />
public partial class InitialCreate : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Books",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                Authors = table.Column<string>(type: "nvarchar(max)", nullable: false),
                Isbn = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                PublishedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                Pages = table.Column<int>(type: "int", nullable: false),
                Language = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                Genre = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Tags = table.Column<string>(type: "nvarchar(max)", nullable: false),
                Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                CoverUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                BookType = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                Duration = table.Column<int>(type: "int", nullable: true),
                Narrator = table.Column<string>(type: "nvarchar(max)", nullable: true),
                AudioFormat = table.Column<string>(type: "nvarchar(max)", nullable: true),
                FileSize = table.Column<long>(type: "bigint", nullable: true),
                StreamingUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                ListenCount = table.Column<int>(type: "int", nullable: true),
                Format = table.Column<string>(type: "nvarchar(max)", nullable: true),
                EBook_FileSize = table.Column<long>(type: "bigint", nullable: true),
                Drm = table.Column<bool>(type: "bit", nullable: true),
                DownloadUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                DownloadCount = table.Column<int>(type: "int", nullable: true),
                Publisher = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Edition = table.Column<string>(type: "nvarchar(max)", nullable: true),
                PrintedBook_Format = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Weight = table.Column<double>(type: "float", nullable: true),
                Dimensions = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Books", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Loans",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BookId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                LoanDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                DueDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                ReturnDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Loans", x => x.Id);
                table.ForeignKey(
                    name: "FK_Loans_Books_BookId",
                    column: x => x.BookId,
                    principalTable: "Books",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Reviews",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                BookId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Rating = table.Column<int>(type: "int", nullable: false),
                Comment = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                HelpfulCount = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Reviews", x => x.Id);
                table.ForeignKey(
                    name: "FK_Reviews_Books_BookId",
                    column: x => x.BookId,
                    principalTable: "Books",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Books_Genre",
            table: "Books",
            column: "Genre");

        migrationBuilder.CreateIndex(
            name: "IX_Books_Isbn",
            table: "Books",
            column: "Isbn");

        migrationBuilder.CreateIndex(
            name: "IX_Books_Title",
            table: "Books",
            column: "Title");

        migrationBuilder.CreateIndex(
            name: "IX_Loans_BookId",
            table: "Loans",
            column: "BookId");

        migrationBuilder.CreateIndex(
            name: "IX_Loans_DueDate",
            table: "Loans",
            column: "DueDate");

        migrationBuilder.CreateIndex(
            name: "IX_Loans_Status",
            table: "Loans",
            column: "Status");

        migrationBuilder.CreateIndex(
            name: "IX_Loans_UserId",
            table: "Loans",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_BookId",
            table: "Reviews",
            column: "BookId");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_Rating",
            table: "Reviews",
            column: "Rating");

        migrationBuilder.CreateIndex(
            name: "IX_Reviews_UserId",
            table: "Reviews",
            column: "UserId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Loans");

        migrationBuilder.DropTable(
            name: "Reviews");

        migrationBuilder.DropTable(
            name: "Books");
    }
}
