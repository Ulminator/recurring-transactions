# Install mongo
brew update
brew install mongodb

# Make db directory for mongo data
sudo mkdir -p /data/db
chown -R `id -un` /data/db