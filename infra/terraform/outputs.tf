output "api_url" {
  description = "FAMS API public URL"
  value       = azurerm_container_app.fams_api.ingress[0].fqdn
}
