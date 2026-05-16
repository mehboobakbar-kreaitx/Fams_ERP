variable "resource_group_name" {
  description = "Azure resource group name"
  type        = string
  default     = "fams-rg"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "fams_api_image" {
  description = "FAMS API Docker image with tag"
  type        = string
  default     = "ghcr.io/your-org/fams-api:latest"
}
