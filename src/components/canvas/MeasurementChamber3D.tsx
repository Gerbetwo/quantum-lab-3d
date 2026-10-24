"use client";
import React from "react";
import { CoreBlochSphere, type CoreBlochSphereProps } from "../3d/CoreBlochSphere";

export function MeasurementChamber3D(props: CoreBlochSphereProps) {
  return <CoreBlochSphere {...props} showMeasurementPlane={true} />;
}

export default MeasurementChamber3D;
