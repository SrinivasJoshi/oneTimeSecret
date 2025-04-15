#!/bin/bash

# Deployment Script for Docker Compose Application

# --- Configuration ---
# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting. (Use sparingly if defaults aren't set)
# set -u
# Prevent errors in pipelines from being masked.
set -o pipefail

# --- Default Values ---
DEFAULT_BRANCH="main"
DEFAULT_PROJECT_DIR="onetimesecret_app" # Directory name for the clone
DEFAULT_COMPOSE_CMD="up --build -d" # Default docker compose command

# --- Script Arguments ---
GIT_REPO_URL="$1"
BRANCH="${2:-$DEFAULT_BRANCH}"
PROJECT_DIR="${3:-$DEFAULT_PROJECT_DIR}"

# --- Helper Functions ---
log_info() {
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}
log_warn() {
    echo "[WARN] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}
log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}
exit_error() {
    log_error "$1"
    exit 1
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect package manager
detect_package_manager() {
    if command_exists apt-get; then echo "apt";
    elif command_exists yum; then echo "yum";
    elif command_exists dnf; then echo "dnf";
    elif command_exists zypper; then echo "zypper"; # Add SUSE
    elif command_exists pacman; then echo "pacman"; # Add Arch
    else echo "unknown"; fi
}

# --- Prerequisite Installation Functions ---
# NOTE: These require root/sudo privileges. Run script with sudo or ensure user has sudo rights without password.
# Consider running installations separately if needed.

install_git() {
    log_info "Attempting to install Git..."
    case "$PKG_MANAGER" in
        apt) sudo apt-get update && sudo apt-get install -y git ;;
        yum) sudo yum update -y && sudo yum install -y git ;;
        dnf) sudo dnf update -y && sudo dnf install -y git ;;
        zypper) sudo zypper refresh && sudo zypper install -y git ;;
        pacman) sudo pacman -Sy --noconfirm git ;;
        *) exit_error "Cannot automatically install Git for unknown package manager '$PKG_MANAGER'. Please install Git manually.";;
    esac
    log_info "Git installed successfully."
}

install_docker() {
    log_info "Attempting to install Docker..."
    # Using Docker's official convenience script (check security implications if needed)
    if curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh; then
        log_info "Docker installed using convenience script."
        # Add current user to docker group (requires logout/login or newgrp)
        CURRENT_USER=$(whoami)
        if ! groups "$CURRENT_USER" | grep -q '\bdocker\b'; then
             sudo usermod -aG docker "$CURRENT_USER"
             log_warn "Added user '$CURRENT_USER' to the 'docker' group. You may need to log out and log back in, or run 'newgrp docker' in your current shell session to use Docker without sudo."
        fi
        # Enable and start Docker service
        sudo systemctl enable docker || log_warn "Could not enable docker service (maybe not using systemd)"
        sudo systemctl start docker || log_warn "Could not start docker service (maybe not using systemd)"
        log_info "Docker installed and service started/enabled."
        # Clean up script
        rm get-docker.sh
    else
        exit_error "Failed to install Docker using convenience script. Please install Docker manually for your distribution."
    fi

}

install_docker_compose() {
    log_info "Attempting to install Docker Compose (v2 plugin)..."
    # Check if v2 is already installed
    if docker compose version > /dev/null 2>&1; then
        log_info "Docker Compose v2 already installed."
        return
    fi

    # Install v2 plugin (common method for Linux)
    # Check latest version from https://github.com/docker/compose/releases
    LATEST_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$LATEST_COMPOSE_VERSION" ]; then
        log_warn "Could not automatically determine latest Docker Compose version. Attempting common install..."
        # Use generic install command if specific version fetch fails
        DESTINATION="/usr/local/bin/docker-compose" # Or /usr/libexec/docker/cli-plugins for plugin path
        if [ -d "/usr/libexec/docker/cli-plugins" ]; then
            DESTINATION="/usr/libexec/docker/cli-plugins/docker-compose"
        elif [ -d "/usr/lib/docker/cli-plugins" ]; then
            DESTINATION="/usr/lib/docker/cli-plugins/docker-compose"
        fi

        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o $DESTINATION
        sudo chmod +x $DESTINATION
        # Verify
         if docker compose version > /dev/null 2>&1; then
            log_info "Docker Compose v2 plugin installed successfully."
        else
            # Fallback: Try installing docker-compose-plugin via package manager if available
            log_warn "Plugin install might have failed. Trying package manager..."
             case "$PKG_MANAGER" in
                apt) sudo apt-get update && sudo apt-get install -y docker-compose-plugin ;;
                dnf) sudo dnf update -y && sudo dnf install -y docker-compose-plugin ;;
                *) log_warn "Could not install docker-compose-plugin via package manager for '$PKG_MANAGER'." ;;
            esac
            # Final check
            if docker compose version > /dev/null 2>&1; then
                 log_info "Docker Compose v2 plugin installed successfully via package manager."
             else
                 exit_error "Failed to install Docker Compose v2 plugin. Please install it manually."
             fi
         fi
    else
         log_info "Latest Docker Compose version: $LATEST_COMPOSE_VERSION"
        DESTINATION="/usr/local/bin/docker-compose" # Or appropriate plugin path
        if [ -d "/usr/libexec/docker/cli-plugins" ]; then
            DESTINATION="/usr/libexec/docker/cli-plugins/docker-compose"
        elif [ -d "/usr/lib/docker/cli-plugins" ]; then
            DESTINATION="/usr/lib/docker/cli-plugins/docker-compose"
        fi
        sudo curl -L "https://github.com/docker/compose/releases/download/${LATEST_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o $DESTINATION
        sudo chmod +x $DESTINATION
        log_info "Docker Compose v2 plugin installed successfully."
    fi
}


# --- Main Script ---

log_info "Starting Deployment Script..."

# 1. Validate Arguments
if [ -z "$GIT_REPO_URL" ]; then
    log_error "Git repository URL is required."
    echo "Usage: $0 <git_repo_url> [branch] [project_dir]"
    echo "Example: $0 git@github.com:user/repo.git main my_app"
    exit 1
fi

log_info "Deploying Repo: $GIT_REPO_URL"
log_info "Branch:       $BRANCH"
log_info "Directory:    $PROJECT_DIR"

# 2. Check & Install Prerequisites
PKG_MANAGER=$(detect_package_manager)
log_info "Checking prerequisites..."
if [ "$PKG_MANAGER" == "unknown" ]; then
    log_warn "Could not detect package manager. Assuming prerequisites (git, docker, docker compose) are installed."
    if ! command_exists git || ! command_exists docker || ! docker compose version > /dev/null 2>&1; then
        exit_error "Prerequisites missing and cannot auto-install. Please install git, docker, and docker compose v2."
    fi
else
    # Install if missing (requires sudo)
    log_info "Using package manager: $PKG_MANAGER"
    if ! command_exists git; then install_git; fi
    if ! command_exists docker; then install_docker; fi
    if ! docker compose version > /dev/null 2>&1; then install_docker_compose; fi
fi

# 3. Verify Docker is running and accessible by current user
log_info "Verifying Docker daemon access..."
if ! docker info > /dev/null 2>&1; then
    # Attempt to use newgrp if available and needed, otherwise guide user
    if groups | grep -q '\bdocker\b'; then
         log_warn "Docker daemon not accessible, but user is in docker group. Trying 'newgrp docker' might help in the current session."
         log_warn "Otherwise, please log out and log back in."
         exit_error "Docker access check failed. Please ensure docker daemon is running and user has permissions."
    else
         exit_error "Docker daemon is not running or user lacks permissions. Add user to 'docker' group (requires logout/login or use 'newgrp docker') or run this script with sudo."
    fi
fi
log_info "Docker check passed."


# 4. Clone or Update Repository
log_info "Setting up project directory '$PROJECT_DIR'..."
if [ -d "$PROJECT_DIR" ]; then
    log_info "Directory exists. Updating repository..."
    cd "$PROJECT_DIR" || exit_error "Could not change directory to $PROJECT_DIR"
    log_info "Current directory: $(pwd)"
    # Optional: Stash local changes to prevent pull conflicts
    # log_info "Stashing potential local changes..."
    # git stash push -m "Deployment script stash" > /dev/null 2>&1 || true

    log_info "Fetching latest changes..."
    git fetch origin || exit_error "Could not fetch from origin"

    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
        log_info "Checking out branch '$BRANCH'..."
        git checkout "$BRANCH" || exit_error "Could not checkout branch '$BRANCH'"
    fi

    log_info "Pulling latest changes for branch '$BRANCH'..."
    git pull origin "$BRANCH" || exit_error "Could not pull from origin/$BRANCH"

    # Optional: Apply stashed changes
    # log_info "Applying stashed changes..."
    # git stash pop > /dev/null 2>&1 || true
else
    log_info "Cloning repository (branch: $BRANCH)..."
    git clone --branch "$BRANCH" "$GIT_REPO_URL" "$PROJECT_DIR" || exit_error "Could not clone repository"
    cd "$PROJECT_DIR" || exit_error "Could not change directory to $PROJECT_DIR"
    log_info "Current directory: $(pwd)"
fi
log_info "Repository ready."

# 5. Check for .env file *** CRITICAL STEP ***
log_info "Checking for '.env' file..."
if [ ! -f ".env" ]; then
    log_warn "---------------------------------------------------------------------"
    log_warn "IMPORTANT: '.env' file not found in the project directory: $(pwd)"
    log_warn "This file is REQUIRED for production configuration (database credentials, secrets, etc.)."
    if [ -f ".env.example" ]; then
        log_warn "An example file '.env.example' exists. Use it as a template."
        log_warn "Example content:"
        cat .env.example | sed 's/^/    /' # Indent example content
    fi
    log_warn "Please create the '.env' file with the correct production values."
    log_warn "You can create it using 'nano .env' or 'vim .env', or transfer it securely."
    log_warn "---------------------------------------------------------------------"
    exit_error "Deployment halted. Please create the required .env file."
fi
log_info "Found .env file."

# 6. Run Docker Compose
log_info "Executing Docker Compose command: $DEFAULT_COMPOSE_CMD ..."
# Prefer docker compose (v2) over docker-compose (v1)
if docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# Run the command (e.g., up --build -d)
$DOCKER_COMPOSE_CMD $DEFAULT_COMPOSE_CMD || exit_error "Docker Compose command '$DEFAULT_COMPOSE_CMD' failed."

log_info "Docker Compose command executed successfully."
log_info "Application deployment initiated. Services might take a moment to start."

# 7. Post-run Information
log_info "--- Post-Deployment Info ---"
log_info "Checking container status..."
sleep 5 # Brief pause for containers to potentially start
$DOCKER_COMPOSE_CMD ps

# Try to determine the public IP or primary private IP
SERVER_IP=$(curl -s -m 5 https://api.ipify.org || curl -s -m 5 ifconfig.me || hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then SERVER_IP="<server_ip>"; fi

# Determine mapped Nginx port (handle case where it's not set)
NGINX_PORT_OUTPUT=$($DOCKER_COMPOSE_CMD port nginx 80 2>/dev/null || echo "")
NGINX_PORT=$(echo "$NGINX_PORT_OUTPUT" | cut -d ':' -f 2)
if [ -z "$NGINX_PORT" ]; then NGINX_PORT="${NGINX_PORT_ENV:-80}"; fi # Use env var or default 80

log_info "Application should be accessible at: http://$SERVER_IP:$NGINX_PORT (Ensure firewall allows port $NGINX_PORT)"
log_info "To view logs: cd $(pwd) && $DOCKER_COMPOSE_CMD logs -f"
log_info "To view specific service logs: $DOCKER_COMPOSE_CMD logs -f <service_name> (e.g., backend, nginx)"
log_info "To stop application: cd $(pwd) && $DOCKER_COMPOSE_CMD down"
log_info "-----------------------------"
log_info "Deployment script finished."

exit 0