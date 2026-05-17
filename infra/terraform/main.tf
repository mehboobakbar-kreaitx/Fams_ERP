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
  revision_mode                = "Multiple"

  template {
    min_replicas = 2
    max_replicas = 10

    container {
      name   = "fams-api"
      image  = var.fams_api_image
      cpu    = 1.0
      memory = "2Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
    }

    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = 50
    }

    custom_scale_rule {
      name             = "cpu-scaling"
      custom_rule_type = "cpu"
      metadata = {
        type  = "Utilization"
        value = "70"
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

resource "azurerm_container_app" "fams_gateway" {
  name                         = "fams-gateway"
  container_app_environment_id = azurerm_container_app_environment.fams.id
  resource_group_name          = azurerm_resource_group.fams.name
  revision_mode                = "Multiple"

  template {
    min_replicas = 2
    max_replicas = 5

    container {
      name   = "fams-gateway"
      image  = var.fams_gateway_image
      cpu    = 0.25
      memory = "512Mi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
    }

    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = 100
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
