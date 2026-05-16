terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "fams" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_container_app_environment" "fams" {
  name                       = "fams-env"
  location                   = azurerm_resource_group.fams.location
  resource_group_name        = azurerm_resource_group.fams.name
}

resource "azurerm_container_app" "fams_api" {
  name                         = "fams-api"
  container_app_environment_id = azurerm_container_app_environment.fams.id
  resource_group_name          = azurerm_resource_group.fams.name
  revision_mode                = "Single"

  template {
    container {
      name   = "fams-api"
      image  = var.fams_api_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 5000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
