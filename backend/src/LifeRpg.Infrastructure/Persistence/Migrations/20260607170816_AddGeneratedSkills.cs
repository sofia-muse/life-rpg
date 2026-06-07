using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeRpg.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGeneratedSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GeneratedSkills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HeroId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    Stat = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    BonusPercent = table.Column<int>(type: "int", nullable: false),
                    Effect = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeneratedSkills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GeneratedSkills_Heroes_HeroId",
                        column: x => x.HeroId,
                        principalTable: "Heroes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedSkills_HeroId",
                table: "GeneratedSkills",
                column: "HeroId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GeneratedSkills");
        }
    }
}
