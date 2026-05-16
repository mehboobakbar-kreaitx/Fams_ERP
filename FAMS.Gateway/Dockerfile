FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["FAMS.Gateway/FAMS.Gateway.csproj", "FAMS.Gateway/"]
RUN dotnet restore "FAMS.Gateway/FAMS.Gateway.csproj"

COPY . .
RUN dotnet publish "FAMS.Gateway/FAMS.Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "FAMS.Gateway.dll"]
