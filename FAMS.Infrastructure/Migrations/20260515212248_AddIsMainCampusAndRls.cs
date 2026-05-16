using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FAMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsMainCampusAndRls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsMainCampus",
                table: "campuses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "goods_receipts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiptNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PurchaseOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceivedById = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DeliveryNoteRef = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goods_receipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_goods_receipts_purchase_orders_PurchaseOrderId",
                        column: x => x.PurchaseOrderId,
                        principalTable: "purchase_orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "purchase_requisitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RequisitionNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    RequestedById = table.Column<Guid>(type: "uuid", nullable: false),
                    Department = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Justification = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    NeededBy = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EstimatedTotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ReviewedById = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    LinkedPurchaseOrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_purchase_requisitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "goods_receipt_line_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GoodsReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    POLineItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuantityReceived = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    QuantityRejected = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Condition = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goods_receipt_line_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_goods_receipt_line_items_goods_receipts_GoodsReceiptId",
                        column: x => x.GoodsReceiptId,
                        principalTable: "goods_receipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_goods_receipt_line_items_po_line_items_POLineItemId",
                        column: x => x.POLineItemId,
                        principalTable: "po_line_items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "requisition_line_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RequisitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    EstimatedUnitPrice = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CampusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: false),
                    UpdatedBy = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeletedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_requisition_line_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_requisition_line_items_purchase_requisitions_RequisitionId",
                        column: x => x.RequisitionId,
                        principalTable: "purchase_requisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_campuses_IsMainCampus",
                table: "campuses",
                column: "IsMainCampus");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receipt_line_items_GoodsReceiptId",
                table: "goods_receipt_line_items",
                column: "GoodsReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receipt_line_items_POLineItemId",
                table: "goods_receipt_line_items",
                column: "POLineItemId");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receipts_PurchaseOrderId",
                table: "goods_receipts",
                column: "PurchaseOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_goods_receipts_ReceiptNumber",
                table: "goods_receipts",
                column: "ReceiptNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_CampusId_Status",
                table: "purchase_requisitions",
                columns: new[] { "CampusId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_purchase_requisitions_RequisitionNumber",
                table: "purchase_requisitions",
                column: "RequisitionNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_requisition_line_items_RequisitionId",
                table: "requisition_line_items",
                column: "RequisitionId");

            // ----- Row Level Security (NFR-08 / PRD §9.4) -----
            // Helper: returns the campus_id set on the session (NULL when not set).
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION current_campus_id() RETURNS UUID AS $$
                  SELECT NULLIF(current_setting('app.campus_id', true), '')::UUID;
                $$ LANGUAGE sql STABLE;");

            // Helper: cross-campus access flag (true = SystemAdmin / background jobs).
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION cross_campus_access() RETURNS BOOLEAN AS $$
                  SELECT COALESCE(current_setting('app.cross_campus_access', true), 'false') = 'true';
                $$ LANGUAGE sql STABLE;");

            string[] rlsTables = { "students", "staff", "fee_invoices", "attendances", "applications" };
            foreach (var table in rlsTables)
            {
                migrationBuilder.Sql($"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($@"
                    DROP POLICY IF EXISTS tenant_isolation ON {table};
                    CREATE POLICY tenant_isolation ON {table}
                    USING (cross_campus_access() OR ""CampusId"" = current_campus_id())
                    WITH CHECK (cross_campus_access() OR ""CampusId"" = current_campus_id());");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            string[] rlsTables = { "students", "staff", "fee_invoices", "attendances", "applications" };
            foreach (var table in rlsTables)
            {
                migrationBuilder.Sql($"DROP POLICY IF EXISTS tenant_isolation ON {table};");
                migrationBuilder.Sql($"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;");
            }
            migrationBuilder.Sql("DROP FUNCTION IF EXISTS cross_campus_access();");

            migrationBuilder.DropTable(
                name: "goods_receipt_line_items");

            migrationBuilder.DropTable(
                name: "requisition_line_items");

            migrationBuilder.DropTable(
                name: "goods_receipts");

            migrationBuilder.DropTable(
                name: "purchase_requisitions");

            migrationBuilder.DropIndex(
                name: "IX_campuses_IsMainCampus",
                table: "campuses");

            migrationBuilder.DropColumn(
                name: "IsMainCampus",
                table: "campuses");
        }
    }
}
