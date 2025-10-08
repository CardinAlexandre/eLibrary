terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.0"
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "elibrary" {
  name     = var.resource_group_name
  location = var.location
  tags = {
    Environment = var.environment
    Project     = "eLibrary"
  }
}

# Container Registry
resource "azurerm_container_registry" "elibrary" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.elibrary.name
  location            = azurerm_resource_group.elibrary.location
  sku                 = "Standard"
  admin_enabled       = true

  tags = {
    Environment = var.environment
  }
}

# SQL Server
resource "azurerm_mssql_server" "elibrary" {
  name                         = var.sql_server_name
  resource_group_name          = azurerm_resource_group.elibrary.name
  location                     = azurerm_resource_group.elibrary.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = var.sql_admin_password

  tags = {
    Environment = var.environment
  }
}

# Catalog Database
resource "azurerm_mssql_database" "catalog" {
  name      = "CatalogDb"
  server_id = azurerm_mssql_server.elibrary.id
  sku_name  = "S0"

  tags = {
    Environment = var.environment
  }
}

# Auth Database
resource "azurerm_mssql_database" "auth" {
  name      = "AuthDb"
  server_id = azurerm_mssql_server.elibrary.id
  sku_name  = "S0"

  tags = {
    Environment = var.environment
  }
}

# Redis Cache
resource "azurerm_redis_cache" "elibrary" {
  name                = var.redis_name
  location            = azurerm_resource_group.elibrary.location
  resource_group_name = azurerm_resource_group.elibrary.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false

  tags = {
    Environment = var.environment
  }
}

# Container App Environment
resource "azurerm_container_app_environment" "elibrary" {
  name                = "${var.resource_prefix}-cae"
  location            = azurerm_resource_group.elibrary.location
  resource_group_name = azurerm_resource_group.elibrary.name

  tags = {
    Environment = var.environment
  }
}

# Storage Account for logs
resource "azurerm_storage_account" "elibrary" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.elibrary.name
  location                 = azurerm_resource_group.elibrary.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = var.environment
  }
}

# Application Insights
resource "azurerm_application_insights" "elibrary" {
  name                = "${var.resource_prefix}-insights"
  location            = azurerm_resource_group.elibrary.location
  resource_group_name = azurerm_resource_group.elibrary.name
  application_type    = "web"

  tags = {
    Environment = var.environment
  }
}

# Virtual Network
resource "azurerm_virtual_network" "elibrary" {
  name                = "${var.resource_prefix}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.elibrary.location
  resource_group_name = azurerm_resource_group.elibrary.name

  tags = {
    Environment = var.environment
  }
}

# Subnet for services
resource "azurerm_subnet" "services" {
  name                 = "services-subnet"
  resource_group_name  = azurerm_resource_group.elibrary.name
  virtual_network_name = azurerm_virtual_network.elibrary.name
  address_prefixes     = ["10.0.1.0/24"]
}

