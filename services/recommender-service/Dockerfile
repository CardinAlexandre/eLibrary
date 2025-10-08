FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RecommenderService.csproj", "./"]
RUN dotnet restore "RecommenderService.csproj"
COPY . .
RUN dotnet build "RecommenderService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RecommenderService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RecommenderService.dll"]

