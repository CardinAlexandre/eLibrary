variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "elibrary-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "West Europe"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "resource_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "elibrary"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "elibraryacr"
}

variable "sql_server_name" {
  description = "Name of the SQL Server"
  type        = string
  default     = "elibrary-sql-server"
}

variable "sql_admin_username" {
  description = "SQL Server admin username"
  type        = string
  default     = "sqladmin"
}

variable "sql_admin_password" {
  description = "SQL Server admin password"
  type        = string
  sensitive   = true
}

variable "redis_name" {
  description = "Name of the Redis cache"
  type        = string
  default     = "elibrary-redis"
}

variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
  default     = "elibrarystorage"
}

