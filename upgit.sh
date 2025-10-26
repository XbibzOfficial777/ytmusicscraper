#!/bin/bash

# ==================================================
# GITHUB AUTO UPLOAD v6.0 - ENHANCED EDITION
# Automation tool for GitHub with advanced features
# ==================================================

# Script metadata
SCRIPT_VERSION="6.0.0"
SCRIPT_NAME="GitHub Auto Upload Enhanced"
AUTHOR="Enhanced by Claude"
GITHUB_REPO="https://github.com/xbibz/github-auto-upload"

# Color configuration with better contrast
declare -A COLORS=(
    [RED]='\033[0;31m'
    [GREEN]='\033[0;32m'
    [YELLOW]='\033[1;33m'
    [BLUE]='\033[0;34m'
    [PURPLE]='\033[0;35m'
    [CYAN]='\033[0;36m'
    [WHITE]='\033[1;37m'
    [GRAY]='\033[0;37m'
    [BOLD]='\033[1m'
    [DIM]='\033[2m'
    [RESET]='\033[0m'
)

# Configuration paths with XDG compliance
XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-"$HOME/.config"}
CONFIG_DIR="$XDG_CONFIG_HOME/github-auto-upload"
TOKEN_FILE="$CONFIG_DIR/token.enc"
CONFIG_FILE="$CONFIG_DIR/config.json"
USER_FILE="$CONFIG_DIR/user.json"
LOG_FILE="$CONFIG_DIR/logs/$(date +%Y-%m).log"
CACHE_DIR="$CONFIG_DIR/cache"

# Global variables
GITHUB_TOKEN=""
TARGET_DIR=""
INTERACTIVE_MODE=true
DEBUG_MODE=false
FORCE_MODE=false
BRANCH_NAME=""
COMMIT_MESSAGE=""
REPO_URL=""

# Logging functions
log_info() {
    local message="$1"
    echo -e "${COLORS[CYAN]}[INFO]${COLORS[RESET]} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $message" >> "$LOG_FILE" 2>/dev/null
}

log_warn() {
    local message="$1"
    echo -e "${COLORS[YELLOW]}[WARN]${COLORS[RESET]} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $message" >> "$LOG_FILE" 2>/dev/null
}

log_error() {
    local message="$1"
    echo -e "${COLORS[RED]}[ERROR]${COLORS[RESET]} $message" >&2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $message" >> "$LOG_FILE" 2>/dev/null
}

log_success() {
    local message="$1"
    echo -e "${COLORS[GREEN]}[SUCCESS]${COLORS[RESET]} $message"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $message" >> "$LOG_FILE" 2>/dev/null
}

log_debug() {
    local message="$1"
    if [[ "$DEBUG_MODE" == true ]]; then
        echo -e "${COLORS[GRAY]}[DEBUG]${COLORS[RESET]} $message"
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] DEBUG: $message" >> "$LOG_FILE" 2>/dev/null
    fi
}

# Utility functions
create_directories() {
    local dirs=("$CONFIG_DIR" "$CACHE_DIR" "$(dirname "$LOG_FILE")")
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            chmod 700 "$dir"
            log_debug "Created directory: $dir"
        fi
    done
}

cleanup() {
    log_debug "Cleaning up temporary files..."
    # Remove old logs (keep last 30 days)
    find "$(dirname "$LOG_FILE")" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    # Clean cache files older than 1 hour
    find "$CACHE_DIR" -type f -mmin +60 -delete 2>/dev/null || true
}

spinner() {
    local pid=$1
    local delay=0.1
    local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    
    tput civis 2>/dev/null || true
    while ps -p "$pid" > /dev/null 2>&1; do
        for frame in "${frames[@]}"; do
            printf "\r${COLORS[CYAN]}%s${COLORS[RESET]} Processing..." "$frame"
            sleep $delay
        done
    done
    tput cnorm 2>/dev/null || true
    printf "\r"
}

# Enhanced system information
get_system_info() {
    local info_cache="$CACHE_DIR/system_info.json"
    
    # Use cached info if less than 1 hour old
    if [[ -f "$info_cache" && $(($(date +%s) - $(stat -c %Y "$info_cache" 2>/dev/null || echo 0))) -lt 3600 ]]; then
        cat "$info_cache"
        return
    fi
    
    local system_info
    system_info=$(cat <<EOF
{
    "hostname": "$(hostname)",
    "os": "$(uname -s)",
    "kernel": "$(uname -r)",
    "arch": "$(uname -m)",
    "cpu": "$(grep -m1 "model name" /proc/cpuinfo 2>/dev/null | cut -d':' -f2 | sed 's/^ *//' || echo "Unknown")",
    "memory": "$(free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "Unknown")",
    "disk_free": "$(df -h . 2>/dev/null | awk 'NR==2 {print $4}' || echo "Unknown")",
    "git_version": "$(git --version 2>/dev/null || echo "Not installed")",
    "shell": "$SHELL",
    "timestamp": "$(date -Iseconds)"
}
EOF
)
    
    echo "$system_info" | tee "$info_cache"
}

# Enhanced display functions
show_banner() {
    clear
    cat << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     ░██████╗░██╗████████╗██╗░░██╗██╗░░░██╗██████╗░              ║
║     ██╔════╝░██║╚══██╔══╝██║░░██║██║░░░██║██╔══██╗             ║
║     ██║░░██╗░██║░░░██║░░░███████║██║░░░██║██████╦╝             ║
║     ██║░░╚██╗██║░░░██║░░░██╔══██║██║░░░██║██╔══██╗             ║
║     ╚██████╔╝██║░░░██║░░░██║░░██║╚██████╔╝██████╦╝             ║
║     ░╚═════╝░╚═╝░░░╚═╝░░░╚═╝░░╚═╝░╚═════╝░╚═════╝░             ║
║                                                                ║
║              AUTO UPLOAD v6.0 - ENHANCED EDITION              ║
║                     Advanced GitHub Automation                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    
    echo -e "${COLORS[CYAN]}Version:${COLORS[RESET]} $SCRIPT_VERSION"
    echo -e "${COLORS[CYAN]}Author:${COLORS[RESET]} $AUTHOR"
    echo -e "${COLORS[CYAN]}Date:${COLORS[RESET]} $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${COLORS[GRAY]}$(printf '%.0s─' {1..64})${COLORS[RESET]}"
}

show_help() {
    cat << EOF
${COLORS[BOLD]}USAGE:${COLORS[RESET]}
    $0 [OPTIONS] [DIRECTORY]

${COLORS[BOLD]}OPTIONS:${COLORS[RESET]}
    -h, --help          Show this help message
    -v, --version       Show version information
    -d, --debug         Enable debug mode
    -f, --force         Force operations without confirmation
    -q, --quiet         Non-interactive mode
    -b, --branch NAME   Specify branch name
    -m, --message MSG   Commit message
    -r, --repo URL      Repository URL
    -t, --token TOKEN   GitHub token (not recommended)
    --dry-run          Show what would be done without executing
    --config           Show current configuration
    --reset            Reset all configurations

${COLORS[BOLD]}EXAMPLES:${COLORS[RESET]}
    $0                              # Interactive mode, current directory
    $0 /path/to/project            # Upload specific directory
    $0 -m "Update docs" -b main    # Quick commit with message
    $0 --dry-run                   # Preview operations
    $0 --reset                     # Reset configurations

${COLORS[BOLD]}ENVIRONMENT VARIABLES:${COLORS[RESET]}
    GITHUB_TOKEN       GitHub personal access token
    GIT_AUTHOR_NAME    Git author name
    GIT_AUTHOR_EMAIL   Git author email
    DEBUG              Enable debug mode (1/true)

For more information, visit: $GITHUB_REPO
EOF
}

# Enhanced token management with encryption
encrypt_token() {
    local token="$1"
    local key
    key=$(openssl rand -hex 32 2>/dev/null || echo "fallback_key_$(whoami)_$(hostname)")
    echo "$token" | openssl enc -aes-256-cbc -base64 -pass pass:"$key" 2>/dev/null > "$TOKEN_FILE" || {
        # Fallback to base64 if openssl is not available
        echo "$token" | base64 > "$TOKEN_FILE"
    }
    chmod 600 "$TOKEN_FILE"
    log_success "Token encrypted and saved securely"
}

decrypt_token() {
    if [[ ! -f "$TOKEN_FILE" ]]; then
        return 1
    fi
    
    local key
    key=$(openssl rand -hex 32 2>/dev/null || echo "fallback_key_$(whoami)_$(hostname)")
    
    # Try OpenSSL decryption first
    if command -v openssl >/dev/null 2>&1; then
        openssl enc -aes-256-cbc -d -base64 -pass pass:"$key" < "$TOKEN_FILE" 2>/dev/null || {
            # Fallback to base64 decode
            base64 -d < "$TOKEN_FILE" 2>/dev/null
        }
    else
        # Fallback to base64 decode
        base64 -d < "$TOKEN_FILE" 2>/dev/null
    fi
}

# Enhanced GitHub API functions
validate_github_token() {
    local token="$1"
    local response
    
    if [[ -z "$token" ]]; then
        return 1
    fi
    
    log_debug "Validating GitHub token..."
    response=$(curl -s -m 10 -w "%{http_code}" \
        -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user 2>/dev/null)
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    case "$http_code" in
        200)
            local username
            username=$(echo "$body" | grep -o '"login":"[^"]*' | cut -d'"' -f4)
            log_success "Token validated successfully for user: $username"
            return 0
            ;;
        401)
            log_error "Invalid GitHub token"
            return 1
            ;;
        403)
            log_error "GitHub token has insufficient permissions"
            return 1
            ;;
        *)
            log_error "GitHub API returned HTTP $http_code"
            return 1
            ;;
    esac
}

get_github_user_info() {
    local token="$1"
    local response
    
    response=$(curl -s -m 10 \
        -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user 2>/dev/null)
    
    if [[ $? -eq 0 && -n "$response" ]]; then
        echo "$response"
    else
        return 1
    fi
}

# Configuration management
save_config() {
    local config
    config=$(cat <<EOF
{
    "version": "$SCRIPT_VERSION",
    "last_updated": "$(date -Iseconds)",
    "default_branch": "${BRANCH_NAME:-main}",
    "auto_push": true,
    "interactive_mode": $INTERACTIVE_MODE,
    "debug_mode": $DEBUG_MODE
}
EOF
)
    echo "$config" > "$CONFIG_FILE"
    chmod 600 "$CONFIG_FILE"
    log_debug "Configuration saved"
}

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        local config
        config=$(cat "$CONFIG_FILE" 2>/dev/null)
        if [[ -n "$config" ]]; then
            # Parse JSON config (basic parsing)
            BRANCH_NAME=$(echo "$config" | grep -o '"default_branch":"[^"]*' | cut -d'"' -f4)
            log_debug "Configuration loaded"
        fi
    fi
}

# Enhanced Git operations
init_git_repo() {
    log_info "Initializing Git repository..."
    
    if git rev-parse --is-inside-work-tree &>/dev/null; then
        log_warn "Git repository already exists"
        return 0
    fi
    
    local default_branch="${BRANCH_NAME:-main}"
    
    if git init --initial-branch="$default_branch" 2>/dev/null || git init 2>/dev/null; then
        log_success "Git repository initialized"
        
        # Set default branch if not set during init
        if [[ -z "$(git branch --show-current 2>/dev/null)" ]]; then
            git checkout -b "$default_branch" 2>/dev/null || true
        fi
        
        return 0
    else
        log_error "Failed to initialize Git repository"
        return 1
    fi
}

setup_git_config() {
    log_info "Setting up Git configuration..."
    
    local git_name git_email
    git_name=$(git config --global user.name 2>/dev/null)
    git_email=$(git config --global user.email 2>/dev/null)
    
    # Use environment variables if available
    git_name=${GIT_AUTHOR_NAME:-$git_name}
    git_email=${GIT_AUTHOR_EMAIL:-$git_email}
    
    # Interactive input if needed and in interactive mode
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        if [[ -z "$git_name" ]]; then
            read -p "Enter your Git name: " git_name
        fi
        
        if [[ -z "$git_email" ]]; then
            read -p "Enter your Git email: " git_email
        fi
    fi
    
    if [[ -n "$git_name" && -n "$git_email" ]]; then
        git config --global user.name "$git_name"
        git config --global user.email "$git_email"
        log_success "Git configuration updated: $git_name <$git_email>"
        
        # Save user info
        local user_info
        user_info=$(cat <<EOF
{
    "name": "$git_name",
    "email": "$git_email",
    "updated": "$(date -Iseconds)"
}
EOF
)
        echo "$user_info" > "$USER_FILE"
        chmod 600 "$USER_FILE"
    else
        log_error "Git name and email are required"
        return 1
    fi
}

add_remote_origin() {
    local repo_url="$1"
    
    if [[ -z "$repo_url" ]]; then
        if [[ "$INTERACTIVE_MODE" == true ]]; then
            read -p "Enter GitHub repository URL: " repo_url
        else
            log_error "Repository URL is required"
            return 1
        fi
    fi
    
    # Validate URL format
    if [[ ! "$repo_url" =~ ^https://github\.com/[^/]+/[^/]+\.git$ ]] && 
       [[ ! "$repo_url" =~ ^git@github\.com:[^/]+/[^/]+\.git$ ]]; then
        log_error "Invalid GitHub repository URL format"
        return 1
    fi
    
    log_info "Adding remote origin: $repo_url"
    
    if git remote get-url origin &>/dev/null; then
        if [[ "$FORCE_MODE" == true ]] || [[ "$INTERACTIVE_MODE" == false ]]; then
            git remote set-url origin "$repo_url"
        else
            read -p "Remote origin exists. Update URL? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git remote set-url origin "$repo_url"
            else
                log_info "Using existing remote origin"
                return 0
            fi
        fi
    else
        git remote add origin "$repo_url"
    fi
    
    log_success "Remote origin configured"
}

stage_changes() {
    log_info "Staging changes..."
    
    # Create .gitignore if it doesn't exist
    if [[ ! -f ".gitignore" ]]; then
        cat > .gitignore << 'EOF'
# System files
.DS_Store
Thumbs.db
*.tmp
*.swp
*.swo
*~

# IDE files
.vscode/
.idea/
*.sublime-*

# Logs
*.log
logs/

# Dependencies
node_modules/
vendor/
.env

# Build outputs
dist/
build/
*.o
*.so
*.dylib
*.exe

# This script and its config
$(basename "$0")
.config/github-auto-upload/
EOF
        log_success "Created .gitignore file"
    fi
    
    if git add . 2>/dev/null; then
        local staged_files
        staged_files=$(git diff --cached --name-only | wc -l)
        log_success "Staged $staged_files files"
        return 0
    else
        log_error "Failed to stage changes"
        return 1
    fi
}

create_commit() {
    local message="$1"
    
    if [[ -z "$message" ]]; then
        if [[ "$INTERACTIVE_MODE" == true ]]; then
            read -p "Enter commit message: " message
        else
            message="Automated commit - $(date '+%Y-%m-%d %H:%M:%S')"
        fi
    fi
    
    log_info "Creating commit: $message"
    
    if git commit -m "$message" 2>/dev/null; then
        log_success "Commit created successfully"
        return 0
    elif git diff --cached --quiet; then
        log_warn "No changes to commit"
        return 1
    else
        log_error "Failed to create commit"
        return 1
    fi
}

push_changes() {
    local branch="${BRANCH_NAME:-$(git branch --show-current)}"
    
    log_info "Pushing changes to origin/$branch..."
    
    # Try normal push first
    if git push origin "$branch" 2>/dev/null; then
        log_success "Changes pushed successfully"
        return 0
    fi
    
    # Try with upstream set
    if git push -u origin "$branch" 2>/dev/null; then
        log_success "Changes pushed successfully (upstream set)"
        return 0
    fi
    
    # Force push if allowed
    if [[ "$FORCE_MODE" == true ]]; then
        log_warn "Attempting force push..."
        if git push --force-with-lease origin "$branch" 2>/dev/null; then
            log_success "Force push completed"
            return 0
        fi
    fi
    
    log_error "Failed to push changes"
    return 1
}

# Main workflow functions
authenticate() {
    log_info "Setting up GitHub authentication..."
    
    # Check environment variable first
    if [[ -n "$GITHUB_TOKEN" ]]; then
        if validate_github_token "$GITHUB_TOKEN"; then
            return 0
        else
            log_warn "Invalid token in environment variable"
            GITHUB_TOKEN=""
        fi
    fi
    
    # Try to load saved token
    local saved_token
    saved_token=$(decrypt_token)
    if [[ -n "$saved_token" ]] && validate_github_token "$saved_token"; then
        GITHUB_TOKEN="$saved_token"
        log_success "Using saved authentication token"
        return 0
    fi
    
    # Interactive token input
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        echo -e "${COLORS[YELLOW]}GitHub Personal Access Token needed${COLORS[RESET]}"
        echo "Create one at: https://github.com/settings/tokens"
        echo "Required scopes: repo, workflow"
        echo
        
        read -s -p "Enter your GitHub token: " token_input
        echo
        
        if validate_github_token "$token_input"; then
            GITHUB_TOKEN="$token_input"
            encrypt_token "$token_input"
            return 0
        else
            log_error "Invalid token provided"
            return 1
        fi
    else
        log_error "GitHub token required for non-interactive mode"
        return 1
    fi
}

select_target_directory() {
    if [[ -n "$TARGET_DIR" ]]; then
        if [[ ! -d "$TARGET_DIR" ]]; then
            log_error "Target directory does not exist: $TARGET_DIR"
            return 1
        fi
        cd "$TARGET_DIR" || return 1
        log_info "Using target directory: $TARGET_DIR"
        return 0
    fi
    
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        echo -e "${COLORS[CYAN]}Select target directory:${COLORS[RESET]}"
        echo "1. Current directory: $(pwd)"
        echo "2. Enter custom path"
        
        read -p "Choice (1-2): " choice
        case "$choice" in
            1)
                TARGET_DIR=$(pwd)
                ;;
            2)
                read -p "Enter directory path: " custom_path
                if [[ -d "$custom_path" ]]; then
                    TARGET_DIR=$(realpath "$custom_path")
                    cd "$TARGET_DIR" || return 1
                else
                    log_error "Directory does not exist: $custom_path"
                    return 1
                fi
                ;;
            *)
                log_error "Invalid choice"
                return 1
                ;;
        esac
    else
        TARGET_DIR=$(pwd)
    fi
    
    log_info "Working in: $TARGET_DIR"
}

# Dry run functionality
dry_run() {
    echo -e "${COLORS[YELLOW]}DRY RUN MODE - No changes will be made${COLORS[RESET]}"
    echo
    
    # Show what would be done
    echo "Target directory: ${TARGET_DIR:-$(pwd)}"
    echo "Branch: ${BRANCH_NAME:-$(git branch --show-current 2>/dev/null || echo 'main')}"
    echo "Commit message: ${COMMIT_MESSAGE:-'Automated commit - $(date)'}"
    echo "Repository URL: ${REPO_URL:-'$(git remote get-url origin 2>/dev/null || echo 'Not set')'}"
    echo
    
    # Show files that would be added
    if git status --porcelain 2>/dev/null | head -20; then
        echo "Files to be committed (showing first 20):"
        git status --porcelain 2>/dev/null | head -20
    else
        echo "No changes detected"
    fi
    
    echo -e "${COLORS[YELLOW]}End of dry run${COLORS[RESET]}"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                echo "$SCRIPT_NAME v$SCRIPT_VERSION"
                exit 0
                ;;
            -d|--debug)
                DEBUG_MODE=true
                shift
                ;;
            -f|--force)
                FORCE_MODE=true
                shift
                ;;
            -q|--quiet)
                INTERACTIVE_MODE=false
                shift
                ;;
            -b|--branch)
                BRANCH_NAME="$2"
                shift 2
                ;;
            -m|--message)
                COMMIT_MESSAGE="$2"
                shift 2
                ;;
            -r|--repo)
                REPO_URL="$2"
                shift 2
                ;;
            -t|--token)
                GITHUB_TOKEN="$2"
                log_warn "Passing tokens via command line is not secure"
                shift 2
                ;;
            --dry-run)
                dry_run
                exit 0
                ;;
            --config)
                echo "Configuration directory: $CONFIG_DIR"
                [[ -f "$CONFIG_FILE" ]] && cat "$CONFIG_FILE" || echo "No config file found"
                exit 0
                ;;
            --reset)
                read -p "Reset all configurations? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    rm -rf "$CONFIG_DIR"
                    log_success "Configuration reset complete"
                fi
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
            *)
                TARGET_DIR="$1"
                shift
                ;;
        esac
    done
}

# Main function
main() {
    # Set up environment
    create_directories
    load_config
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show banner unless in quiet mode
    if [[ "$INTERACTIVE_MODE" == true ]]; then
        show_banner
    fi
    
    # Set up signal handlers
    trap cleanup EXIT
    trap 'log_error "Script interrupted"; exit 1' SIGINT SIGTERM
    
    # Main workflow
    log_info "Starting GitHub Auto Upload v$SCRIPT_VERSION"
    
    select_target_directory || exit 1
    authenticate || exit 1
    setup_git_config || exit 1
    
    # Initialize or validate Git repository
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        init_git_repo || exit 1
    fi
    
    # Set up remote if provided
    if [[ -n "$REPO_URL" ]]; then
        add_remote_origin "$REPO_URL" || exit 1
    elif ! git remote get-url origin &>/dev/null; then
        if [[ "$INTERACTIVE_MODE" == true ]]; then
            read -p "Add remote repository? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                add_remote_origin || exit 1
            fi
        fi
    fi
    
    # Stage and commit changes
    stage_changes || exit 1
    create_commit "$COMMIT_MESSAGE" || {
        if [[ $? -eq 1 ]]; then
            log_info "No changes to commit, exiting"
            exit 0
        else
            exit 1
        fi
    }
    
    # Push changes if remote exists
    if git remote get-url origin &>/dev/null; then
        push_changes || exit 1
    else
        log_warn "No remote repository configured, skipping push"
    fi
    
    # Save configuration
    save_config
    
    log_success "GitHub Auto Upload completed successfully!"
    
    # Show final repository status
    if [[ "$DEBUG_MODE" == true ]]; then
        echo -e "\n${COLORS[GRAY]}Final repository status:${COLORS[RESET]}"
        git log --oneline -3 2>/dev/null || true
    fi
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
