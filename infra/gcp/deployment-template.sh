# GCP Deployment Template
# Enterprise-grade GCP deployment for React + Java + Azure Golden Path

gcloud config set project ${PROJECT_ID}

# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com

# Create GKE cluster
gcloud container clusters create react-java-cluster \
    --machine-type=e2-standard-4 \
    --num-nodes=3 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=10 \
    --region=${REGION}

# Create Cloud SQL instance
gcloud sql instances create react-java-db \
    --database-version=POSTGRES_13 \
    --tier=db-g1-small \
    --region=${REGION}

# Create Redis instance
gcloud redis instances create react-java-cache \
    --size=1 \
    --region=${REGION}

# Build and deploy backend
gcloud builds submit --config=cloudbuild-backend.yaml backend/

# Build and deploy frontend
gcloud builds submit --config=cloudbuild-frontend.yaml frontend/

# Deploy to GKE
kubectl apply -f k8s/gcp/