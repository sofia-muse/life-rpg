using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LifeRpg.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestEvolutionPathId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvolutionPathId",
                table: "Quests",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "LastStreakFreezeDate",
                table: "Heroes",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Raids",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LeaderHeroId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SagaTitle = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    RewardTitle = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    UnitLabel = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    TargetAmount = table.Column<int>(type: "int", nullable: false),
                    Stat = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    InviteCode = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false),
                    MaxMembers = table.Column<int>(type: "int", nullable: false),
                    Deadline = table.Column<DateOnly>(type: "date", nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CompletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Raids", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Raids_Heroes_LeaderHeroId",
                        column: x => x.LeaderHeroId,
                        principalTable: "Heroes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RaidContributions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RaidId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HeroId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ClientId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ContributionDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaidContributions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaidContributions_Heroes_HeroId",
                        column: x => x.HeroId,
                        principalTable: "Heroes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RaidContributions_Raids_RaidId",
                        column: x => x.RaidId,
                        principalTable: "Raids",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RaidMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RaidId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HeroId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    JoinedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaidMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RaidMemberships_Heroes_HeroId",
                        column: x => x.HeroId,
                        principalTable: "Heroes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RaidMemberships_Raids_RaidId",
                        column: x => x.RaidId,
                        principalTable: "Raids",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuestCompletions_QuestId_CompletionDate",
                table: "QuestCompletions",
                columns: new[] { "QuestId", "CompletionDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RaidContributions_HeroId",
                table: "RaidContributions",
                column: "HeroId");

            migrationBuilder.CreateIndex(
                name: "IX_RaidContributions_RaidId_ClientId",
                table: "RaidContributions",
                columns: new[] { "RaidId", "ClientId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RaidContributions_RaidId_HeroId_ContributionDate",
                table: "RaidContributions",
                columns: new[] { "RaidId", "HeroId", "ContributionDate" });

            migrationBuilder.CreateIndex(
                name: "IX_RaidMemberships_HeroId",
                table: "RaidMemberships",
                column: "HeroId");

            migrationBuilder.CreateIndex(
                name: "IX_RaidMemberships_RaidId_HeroId",
                table: "RaidMemberships",
                columns: new[] { "RaidId", "HeroId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Raids_InviteCode",
                table: "Raids",
                column: "InviteCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Raids_LeaderHeroId",
                table: "Raids",
                column: "LeaderHeroId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RaidContributions");

            migrationBuilder.DropTable(
                name: "RaidMemberships");

            migrationBuilder.DropTable(
                name: "Raids");

            migrationBuilder.DropIndex(
                name: "IX_QuestCompletions_QuestId_CompletionDate",
                table: "QuestCompletions");

            migrationBuilder.DropColumn(
                name: "EvolutionPathId",
                table: "Quests");

            migrationBuilder.DropColumn(
                name: "LastStreakFreezeDate",
                table: "Heroes");
        }
    }
}
