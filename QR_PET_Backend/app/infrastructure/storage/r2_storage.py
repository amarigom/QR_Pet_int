import asyncio
from typing import BinaryIO, Optional
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException, status


class R2StorageAdapter:
    """
    Implementación concreta de StorageProvider compatible con Cloudflare R2 y AWS/Supabase S3.
    """

    def __init__(
        self,
        bucket_name: str,
        access_key_id: str,
        secret_access_key: str,
        account_id: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        region_name: str = "auto",
    ) -> None:
        self.bucket_name = bucket_name

        resolved_endpoint = endpoint_url or (
            f"https://{account_id}.r2.cloudflarestorage.com" if account_id else None
        )

        self.client = boto3.client(
            service_name="s3",
            endpoint_url=resolved_endpoint,
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name=region_name,
            config=Config(signature_version="s3v4"),
        )

    def _upload_sync(self, file_obj: BinaryIO, key: str, content_type: str) -> int:
        file_obj.seek(0, 2)
        size_bytes = file_obj.tell()
        file_obj.seek(0)

        try:
            self.client.upload_fileobj(
                Fileobj=file_obj,
                Bucket=self.bucket_name,
                Key=key,
                ExtraArgs={
                    "ContentType": content_type,
                    "ContentDisposition": "inline",
                },
            )
            return size_bytes
        except ClientError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error al subir el estudio al almacenamiento: {exc.response['Error']['Message']}",
            ) from exc

    async def upload_file(self, file_obj: BinaryIO, key: str, content_type: str) -> int:
        return await asyncio.to_thread(self._upload_sync, file_obj, key, content_type)

    def generate_presigned_url(self, key: str, expires_in: int = 900) -> str:
        try:
            return self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": key,
                },
                ExpiresIn=expires_in,
            )
        except ClientError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo generar el enlace temporal de acceso al estudio.",
            ) from exc

    def _delete_sync(self, key: str) -> None:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=key)
        except ClientError:
            pass

    async def delete_file(self, key: str) -> None:
        await asyncio.to_thread(self._delete_sync, key)