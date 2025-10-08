FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["ImporterService.csproj", "./"]
RUN dotnet restore "ImporterService.csproj"
COPY . .
RUN dotnet build "ImporterService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ImporterService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ImporterService.dll"]

