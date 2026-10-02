using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeRpg.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestLastStreakDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "LastStreakDate",
                table: "Quests",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastStreakDate",
                table: "Quests");
        }
    }
}
