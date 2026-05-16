FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["FAMS.API/FAMS.API.csproj", "FAMS.API/"]
COPY ["FAMS.Application/FAMS.Application.csproj", "FAMS.Application/"]
COPY ["FAMS.Domain/FAMS.Domain.csproj", "FAMS.Domain/"]
COPY ["FAMS.Infrastructure/FAMS.Infrastructure.csproj", "FAMS.Infrastructure/"]

RUN dotnet restore "FAMS.API/FAMS.API.csproj"

COPY . .

RUN dotnet build "FAMS.API/FAMS.API.csproj" -c Release -o /app/build
RUN dotnet publish "FAMS.API/FAMS.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && adduser --disabled-password --gecos '' appuser \
    && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "FAMS.API.dll"]
