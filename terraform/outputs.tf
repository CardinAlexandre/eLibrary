output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.elibrary.name
}

output "sql_server_fqdn" {
  description = "Fully qualified domain name of the SQL Server"
  value       = azurerm_mssql_server.elibrary.fully_qualified_domain_name
}

output "redis_hostname" {
  description = "Hostname of the Redis cache"
  value       = azurerm_redis_cache.elibrary.hostname
}

output "redis_primary_key" {
  description = "Primary access key for Redis"
  value       = azurerm_redis_cache.elibrary.primary_access_key
  sensitive   = true
}

output "container_registry_login_server" {
  description = "Login server for the Container Registry"
  value       = azurerm_container_registry.elibrary.login_server
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.elibrary.instrumentation_key
  sensitive   = true
}

